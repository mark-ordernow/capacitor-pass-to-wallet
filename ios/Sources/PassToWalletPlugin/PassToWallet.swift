import Foundation

@objc public class PassToWallet: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
