import Capacitor
import Foundation
import PassKit
import UIKit

/// Apple Wallet: add/open/check passes and the official PKAddPassButton.
/// CAPBridgedPlugin registration works on Capacitor 6, 7 and 8.
@objc(PassToWalletPlugin)
public class PassToWalletPlugin: CAPPlugin, CAPBridgedPlugin, PKAddPassesViewControllerDelegate {
    public let identifier = "PassToWalletPlugin"
    public let jsName = "PassToWallet"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "canAddPasses", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "passExists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPass", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addPass", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addButtonSize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showAddButton", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideAddButton", returnType: CAPPluginReturnPromise)
    ]

    private let library = PKPassLibrary()
    private var addButton: PKAddPassButton?
    private var pendingAddCall: CAPPluginCall?

    @objc func canAddPasses(_ call: CAPPluginCall) {
        call.resolve(["canAdd": PKAddPassesViewController.canAddPasses()])
    }

    @objc func passExists(_ call: CAPPluginCall) {
        call.resolve(["exists": findPass(call) != nil])
    }

    @objc func openPass(_ call: CAPPluginCall) {
        guard let url = findPass(call)?.passURL else {
            call.reject("Pass not found")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url) { opened in
                opened ? call.resolve() : call.reject("Unable to open pass")
            }
        }
    }

    /// Resolves only after the add sheet is dismissed (added or cancelled); JS then checks passExists.
    @objc func addPass(_ call: CAPPluginCall) {
        guard let base64 = call.getString("base64"),
              let data = Data(base64Encoded: base64) else {
            call.reject("Invalid base64 pass")
            return
        }
        let pass: PKPass
        do {
            pass = try PKPass(data: data)
        } catch {
            call.reject(error.localizedDescription, "INVALID_PASS", error)
            return
        }
        DispatchQueue.main.async {
            guard self.pendingAddCall == nil else {
                call.reject("Add pass already in progress")
                return
            }
            guard let controller = PKAddPassesViewController(pass: pass),
                  var presenter = self.bridge?.viewController else {
                call.reject("Unable to present add pass sheet")
                return
            }
            // Present from the top-most controller: presenting from one that is
            // already presenting is a no-op, so the delegate (and this call)
            // would never complete.
            while let presented = presenter.presentedViewController {
                presenter = presented
            }
            controller.delegate = self
            self.pendingAddCall = call
            presenter.present(controller, animated: true)
        }
    }

    public func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) {
        controller.dismiss(animated: true) {
            self.pendingAddCall?.resolve()
            self.pendingAddCall = nil
        }
    }

    /// The system's localized size; the web placeholder reserves exactly this.
    @objc func addButtonSize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let size = PKAddPassButton(addPassButtonStyle: .black).intrinsicContentSize
            call.resolve(["width": size.width, "height": size.height])
        }
    }

    /// Frame is CSS px from getBoundingClientRect, which equals points relative to the web view.
    /// The button keeps the size iOS picks (scaling or stretching it distorts the artwork),
    /// centered on the frame.
    @objc func showAddButton(_ call: CAPPluginCall) {
        let frame = CGRect(
            x: call.getDouble("x") ?? 0,
            y: call.getDouble("y") ?? 0,
            width: call.getDouble("width") ?? 0,
            height: call.getDouble("height") ?? 0
        )
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("Web view not available")
                return
            }
            let button = self.addButton ?? self.makeAddButton(in: webView)
            button.bounds = CGRect(origin: .zero, size: button.intrinsicContentSize)
            button.center = CGPoint(x: frame.midX, y: frame.midY)
            button.isHidden = false
            call.resolve()
        }
    }

    @objc func hideAddButton(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.addButton?.isHidden = true
            call.resolve()
        }
    }

    private func makeAddButton(in webView: UIView) -> PKAddPassButton {
        let button = PKAddPassButton(addPassButtonStyle: .black)
        button.addTarget(self, action: #selector(addButtonTapped), for: .touchUpInside)
        webView.addSubview(button)
        addButton = button
        return button
    }

    @objc private func addButtonTapped() {
        notifyListeners("addButtonTap", data: [:])
    }

    private func findPass(_ call: CAPPluginCall) -> PKPass? {
        guard let passTypeIdentifier = call.getString("passTypeIdentifier"),
              let serialNumber = call.getString("serialNumber") else {
            return nil
        }
        return library.pass(withPassTypeIdentifier: passTypeIdentifier, serialNumber: serialNumber)
    }
}
