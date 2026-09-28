Pod::Spec.new do |s|
  s.name           = 'PageReader'
  s.version        = '1.0.0'
  s.summary        = '찍은 쪽에서 글자와 그 위치를 함께 읽는다'
  s.description    = 'Apple Vision으로 줄과 낱말을 읽고, 사진 안의 좌표를 함께 돌려준다.'
  s.license        = 'UNLICENSED'
  s.author         = 'Reread'
  s.homepage       = 'https://github.com/woogie0303'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift}'
end
