/**
 * 광고. 네이티브 모듈(AdMob)이라 개발 빌드에서만 돈다 — Expo Go에서는 모듈이 없어서
 * 광고가 없는 앱처럼 지나간다.
 *
 * **광고가 안 떠도 독자의 길을 막지 않는다.** 못 불러왔거나, 모듈이 없거나, 출시용
 * 광고 단위 ID가 비어 있으면 광고 없이 다음으로 넘어간다. 광고 하나 때문에 책을
 * 찍지 못하는 앱은 광고가 없는 앱보다 나쁘다. 다만 보상형은 다르다 — 보상을 줄 수
 * 없으면 `false`를 돌려주고, 부르는 쪽이 '지금은 광고가 없어요'라고 말한다.
 */
import type * as AdsModule from 'react-native-google-mobile-ads';

/** 광고가 이 시간 안에 안 불러와지면 포기한다 */
const LOAD_TIMEOUT_MS = 6000;

type Ads = typeof AdsModule;

let cached: Ads | null | undefined;

/** Expo Go처럼 네이티브 모듈이 없으면 불러오는 순간 던진다 — 한 번만 시도한다 */
function ads(): Ads | null {
  if (cached === undefined) {
    try {
      // 정적 import는 Expo Go에서 앱을 통째로 죽인다 — 던지는 것을 잡으려고 늦게 불러온다
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cached = require('react-native-google-mobile-ads') as Ads;
    } catch {
      cached = null;
    }
  }
  return cached;
}

let started = false;

/** 앱이 뜬 뒤 한 번. 광고를 처음 부르기 전에 SDK를 깨운다. */
async function start(sdk: Ads) {
  if (started) return;
  started = true;
  try {
    await sdk.default().initialize();
  } catch {
    started = false;
  }
}

/**
 * 개발 중에는 구글의 시험용 광고 단위를 쓴다 — 내 광고 단위로 개발하다 내 기기를
 * 누르면 계정이 정지될 수 있다. 출시 빌드는 `eas.json`의 env에서 온다.
 */
function unitId(sdk: Ads, kind: 'interstitial' | 'rewarded'): string | null {
  if (__DEV__) {
    return kind === 'interstitial'
      ? sdk.TestIds.INTERSTITIAL
      : sdk.TestIds.REWARDED;
  }
  const id =
    kind === 'interstitial'
      ? process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID
      : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID;
  return id || null;
}

/**
 * 광고 하나를 불러와 띄우고, 닫힐 때까지 기다린다. `rewarded`가 참이면 보상을
 * 받았는지를 돌려준다. 어디서든 실패하면 `false`.
 */
function run(kind: 'interstitial' | 'rewarded'): Promise<boolean> {
  const sdk = ads();
  const id = sdk && unitId(sdk, kind);
  if (!sdk || !id) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    void start(sdk).then(() => {
      /**
       * 두 종류가 닫힘·오류·불러옴 이벤트와 `load`/`show`를 똑같이 갖지만 타입이
       * 합쳐지지 않는다. 보상형 쪽으로 좁혀서 쓰고, 보상 이벤트는 보상형일 때만 단다.
       */
      const ad = (kind === 'interstitial'
        ? sdk.InterstitialAd.createForAdRequest(id, {
            requestNonPersonalizedAdsOnly: true,
          })
        : sdk.RewardedAd.createForAdRequest(id, {
            requestNonPersonalizedAdsOnly: true,
          })) as unknown as AdsModule.RewardedAd;

      let earned = false;
      let shown = false;
      const unsubscribe: (() => void)[] = [];
      const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

      /** 한 번만 끝낸다 — 닫힘과 오류와 시간 초과가 겹쳐 와도 */
      let done = false;
      function finish(result: boolean) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        unsubscribe.forEach((off) => off());
        resolve(result);
      }

      unsubscribe.push(
        ad.addAdEventListener(sdk.AdEventType.LOADED, () => {
          /** 불러온 뒤에는 시간 초과로 끊지 않는다 — 광고가 떠 있는 동안이다 */
          clearTimeout(timer);
          shown = true;
          ad.show().catch(() => finish(false));
        }),
        ad.addAdEventListener(sdk.AdEventType.ERROR, () => finish(false)),
        ad.addAdEventListener(sdk.AdEventType.CLOSED, () =>
          finish(kind === 'interstitial' ? shown : earned),
        ),
      );
      if (kind === 'rewarded') {
        unsubscribe.push(
          ad.addAdEventListener(sdk.RewardedAdEventType.EARNED_REWARD, () => {
            earned = true;
          }),
        );
      }
      ad.load();
    });
  });
}

/**
 * 촬영 앞에서 띄우는 전면 광고. 끝나면(또는 못 띄우면) 돌아온다 — 어느 쪽이든
 * 부르는 쪽은 그다음 일을 그대로 한다.
 */
export async function showInterstitial(): Promise<void> {
  await run('interstitial');
}

/**
 * 한도를 다 쓴 독자가 보는 보상형 광고. 끝까지 봐서 보상을 받았으면 `true`.
 * 중간에 닫았거나 광고가 없으면 `false` — 보상을 주면 안 된다.
 */
export function showRewarded(): Promise<boolean> {
  return run('rewarded');
}
