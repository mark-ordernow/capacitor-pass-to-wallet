import { PassToWallet } from '@dilly/capacitor-pass-to-wallet';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    PassToWallet.echo({ value: inputValue })
}
