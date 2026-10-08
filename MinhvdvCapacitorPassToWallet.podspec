require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'MinhvdvCapacitorPassToWallet'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  # Capacitor 6 apps target iOS 13; 7 → 14, 8 → 15 (higher app targets are fine).
  s.ios.deployment_target = '13.0'
  s.dependency 'Capacitor'
  s.frameworks = 'PassKit'
  s.swift_version = '5.1'
end
