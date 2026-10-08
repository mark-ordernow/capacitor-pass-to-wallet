package com.minhvdv.plugins.passtowallet;

import android.app.Activity;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.pay.Pay;
import com.google.android.gms.pay.PayApiAvailabilityStatus;
import com.google.android.gms.pay.PayClient;

/**
 * Google Wallet through the Google Pay API. PayClient only reports results via
 * onActivityResult with a request code, so this uses the request-code bridge
 * (deprecated in Capacitor but still forwarded by BridgeActivity in 6, 7 and 8).
 */
@CapacitorPlugin(name = "PassToWallet", requestCodes = { PassToWalletPlugin.SAVE_PASSES_REQUEST_CODE })
public class PassToWalletPlugin extends Plugin {

    static final int SAVE_PASSES_REQUEST_CODE = 9201;

    private PluginCall pendingSave;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Pay.getClient(getActivity())
            .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
            .addOnSuccessListener((status) -> resolveAvailable(call, status == PayApiAvailabilityStatus.AVAILABLE))
            .addOnFailureListener((error) -> resolveAvailable(call, false));
    }

    /** Resolves on RESULT_OK or RESULT_CANCELED; the app confirms with its backend either way. */
    @PluginMethod
    public void savePassesJwt(PluginCall call) {
        String jwt = call.getString("jwt");
        if (jwt == null || jwt.isEmpty()) {
            call.reject("jwt is required");
            return;
        }
        if (pendingSave != null) {
            call.reject("Save already in progress");
            return;
        }
        pendingSave = call;
        Activity activity = getActivity();
        activity.runOnUiThread(() -> Pay.getClient(activity).savePassesJwt(jwt, activity, SAVE_PASSES_REQUEST_CODE));
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != SAVE_PASSES_REQUEST_CODE || pendingSave == null) return;
        PluginCall call = pendingSave;
        pendingSave = null;
        if (resultCode == Activity.RESULT_OK || resultCode == Activity.RESULT_CANCELED) {
            call.resolve();
            return;
        }
        String message = data == null ? null : data.getStringExtra(PayClient.EXTRA_API_ERROR_MESSAGE);
        call.reject(
            message != null ? message : "Unable to save pass",
            resultCode == PayClient.SavePassesResult.SAVE_ERROR ? "SAVE_ERROR" : "UNKNOWN_RESULT"
        );
    }

    private void resolveAvailable(PluginCall call, boolean available) {
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }
}
