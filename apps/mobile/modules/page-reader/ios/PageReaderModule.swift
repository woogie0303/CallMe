import ExpoModulesCore
import ImageIO
import UIKit
import Vision

/**
 * 찍은 쪽에서 글자를 읽되, 그 글자가 사진의 **어디에** 있는지를 함께 돌려준다.
 *
 * 전에 쓰던 `expo-text-extractor`도 같은 Apple Vision을 쓰지만 줄의 글자만 넘기고
 * 위치는 버렸다. 사진 위에서 단어를 짚으려면 그 위치가 필요해서 이 모듈을 둔다.
 *
 * 좌표는 **화면에 보이는 방향(EXIF를 적용한 뒤)의 픽셀**, 원점은 왼쪽 위다.
 * 함께 돌려주는 `width`/`height`도 같은 좌표계다.
 *
 * ## 기울기
 *
 * 손으로 든 책은 거의 늘 조금 기울어져 찍힌다. 그래서 칸을 반듯한 네모로 주지
 * 않고 **돌아간 네모**로 준다 — `x/y/width/height`는 돌리기 전의 네모이고,
 * `angle`(라디안, 시계 방향)만큼 그 중심을 축으로 돌리면 글자에 겹친다.
 * 반듯한 네모로 주면 기울어진 줄의 칸이 위아래 줄까지 덮고, 줄 순서도 틀린다.
 */
public class PageReaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PageReader")

    AsyncFunction("read") { (url: URL, languages: [String]?, promise: Promise) in
      // 한 장 읽는 데 1초 가까이 걸린다 — 메인 스레드에서 하면 화면이 멈춘다
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          promise.resolve(try readPage(at: url, languages: languages))
        } catch {
          promise.reject("ERR_PAGE_READER", error.localizedDescription)
        }
      }
    }
  }
}

private struct PageReaderError: LocalizedError {
  let errorDescription: String?
}

/** 픽셀 좌표계(원점 왼쪽 위)의 네 꼭짓점 */
private struct Quad {
  var tl: CGPoint
  var tr: CGPoint
  var bl: CGPoint
  var br: CGPoint

  var center: CGPoint {
    CGPoint(x: (tl.x + tr.x + bl.x + br.x) / 4, y: (tl.y + tr.y + bl.y + br.y) / 4)
  }
  /** 윗변과 아랫변의 평균 길이 */
  var width: CGFloat { (distance(tl, tr) + distance(bl, br)) / 2 }
  /** 왼변과 오른변의 평균 길이 */
  var height: CGFloat { (distance(tl, bl) + distance(tr, br)) / 2 }
  /** 윗변이 수평에서 돈 각도 — y가 아래로 자라므로 양수가 시계 방향이다 */
  var angle: CGFloat { atan2(tr.y - tl.y, tr.x - tl.x) }

  /** 가로로 a~b 사이만큼 잘라낸 네모 (0이 왼쪽 끝, 1이 오른쪽 끝) */
  func slice(_ a: CGFloat, _ b: CGFloat) -> Quad {
    Quad(
      tl: lerp(tl, tr, a), tr: lerp(tl, tr, b),
      bl: lerp(bl, br, a), br: lerp(bl, br, b)
    )
  }

  var frame: [String: Double] {
    let c = center
    let w = width
    let h = height
    return [
      "x": Double(c.x - w / 2),
      "y": Double(c.y - h / 2),
      "width": Double(w),
      "height": Double(h),
      "angle": Double(angle),
    ]
  }
}

private func distance(_ a: CGPoint, _ b: CGPoint) -> CGFloat {
  hypot(b.x - a.x, b.y - a.y)
}

private func lerp(_ a: CGPoint, _ b: CGPoint, _ t: CGFloat) -> CGPoint {
  CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t)
}

private func readPage(at url: URL, languages: [String]?) throws -> [String: Any] {
  let data = try Data(contentsOf: url)
  guard let image = UIImage(data: data), let cgImage = image.cgImage else {
    throw PageReaderError(errorDescription: "사진을 열지 못했어요.")
  }

  /** 화면에 보이는 방향의 픽셀 크기 — `image.size`는 방향을 이미 적용한 값이다 */
  let width = image.size.width * image.scale
  let height = image.size.height * image.scale

  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true
  /**
   * 기본은 영어 하나다 — 한국어까지 열어두면 영어 단어를 한글로 잘못 읽는 일이 생긴다.
   * 한국어 책을 찍을 때만 부르는 쪽이 `["ko-KR", "en-US"]`를 넘긴다. 이 기기의 Vision이
   * 모르는 언어는 걸러서, 지원하지 않는 값 하나 때문에 읽기가 통째로 실패하지 않게 한다.
   */
  let supported = (try? request.supportedRecognitionLanguages()) ?? []
  let wanted = (languages ?? []).filter { supported.contains($0) }
  request.recognitionLanguages = wanted.isEmpty ? ["en-US"] : wanted

  /**
   * 방향을 넘겨야 Vision이 똑바로 선 사진으로 읽고, 좌표도 그 기준으로 준다.
   * 넘기지 않으면 세로로 찍은 사진을 옆으로 누운 채 읽는다.
   */
  let handler = VNImageRequestHandler(
    cgImage: cgImage,
    orientation: CGImagePropertyOrientation(image.imageOrientation),
    options: [:]
  )
  try handler.perform([request])

  /** Vision의 정규화 좌표(0~1, 원점 왼쪽 아래) → 픽셀(원점 왼쪽 위) */
  func pixel(_ p: CGPoint) -> CGPoint {
    CGPoint(x: p.x * width, y: (1 - p.y) * height)
  }
  func quad(_ r: VNRectangleObservation) -> Quad {
    Quad(
      tl: pixel(r.topLeft), tr: pixel(r.topRight),
      bl: pixel(r.bottomLeft), br: pixel(r.bottomRight)
    )
  }

  let found = (request.results ?? []).compactMap { observation -> (Quad, VNRecognizedText)? in
    guard let top = observation.topCandidates(1).first else { return nil }
    return (quad(observation), top)
  }

  /**
   * 쪽 전체의 기울기. 줄마다 조금씩 다르게 읽히므로 가운데값을 쓴다 — 평균을
   * 쓰면 짧게 잘못 읽힌 줄 하나가 쪽 전체의 기울기를 끌고 간다.
   */
  let angles = found.map { $0.0.angle }.sorted()
  let tilt = angles.isEmpty ? 0 : angles[angles.count / 2]

  /**
   * 읽는 순서로 줄 세운다. 기울어진 채로 y만 비교하면, 오른쪽이 처진 긴 줄의
   * 끝이 다음 줄보다 아래로 내려가 순서가 뒤집힌다 — 그러면 문장 경계를 찾을 때
   * 엉뚱한 줄의 단어가 끼어든다. 그래서 쪽의 기울기만큼 되돌려 놓고 비교한다.
   */
  func upright(_ p: CGPoint) -> CGPoint {
    let c = cos(-tilt)
    let s = sin(-tilt)
    return CGPoint(x: p.x * c - p.y * s, y: p.x * s + p.y * c)
  }

  let ordered = found.sorted { a, b in
    let pa = upright(a.0.center)
    let pb = upright(b.0.center)
    /** 같은 높이에 나란한 것(쪽 번호와 머리글, 한 줄이 둘로 읽힌 것)은 왼쪽부터 */
    let tolerance = min(a.0.height, b.0.height) * 0.5
    if abs(pa.y - pb.y) > tolerance { return pa.y < pb.y }
    return pa.x < pb.x
  }

  var lines: [[String: Any]] = []
  var words: [[String: Any]] = []

  for (index, (lineQuad, text)) in ordered.enumerated() {
    let string = text.string
    lines.append(["text": string, "frame": lineQuad.frame])

    /**
     * 단어는 공백으로 자른다 — 문장부호를 떼지 않는다. 마침표가 붙어 있어야
     * 짚은 범위를 문장 끝까지 넓힐 수 있다(`shared/ocr/selection.ts`).
     */
    let total = CGFloat(max(string.count, 1))
    var cursor = string.startIndex

    while cursor < string.endIndex {
      guard let start = string[cursor...].firstIndex(where: { !$0.isWhitespace }) else { break }
      let end = string[start...].firstIndex(where: { $0.isWhitespace }) ?? string.endIndex
      let range = start..<end

      /**
       * 글자 수 비율로 줄을 잘라 짐작한 칸. Vision이 단어 칸을 못 주거나,
       * 단어마다 줄 전체 칸을 돌려주는 경우가 있어서(정확도 우선 모드의 알려진
       * 버릇) 물러날 자리로 둔다. 줄의 네 꼭짓점을 따라 자르므로 기울기도 따라간다.
       */
      let a = CGFloat(string.distance(from: string.startIndex, to: start)) / total
      let b = CGFloat(string.distance(from: string.startIndex, to: end)) / total
      var box = lineQuad.slice(a, b)

      if let exact = try? text.boundingBox(for: range) {
        let candidate = quad(exact)
        let isWholeLine = candidate.width >= lineQuad.width * 0.95
        let isOnlyWord = (b - a) >= 0.95
        if !isWholeLine || isOnlyWord { box = candidate }
      }

      words.append(["text": String(string[range]), "line": index, "frame": box.frame])
      cursor = end
    }
  }

  return ["width": Double(width), "height": Double(height), "lines": lines, "words": words]
}

private extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
