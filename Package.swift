// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DillyCapacitorPassToWallet",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "DillyCapacitorPassToWallet",
            targets: ["PassToWalletPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "6.0.0"..<"9.0.0")
    ],
    targets: [
        .target(
            name: "PassToWalletPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/PassToWalletPlugin")
    ]
)