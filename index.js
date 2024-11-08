const algosdk = require('algosdk');

const config = {
    algodToken: "",
    algodServer: "https://testnet-api.algonode.cloud/",
    algodPort: "",
    indexerToken: "",
    indexerServer: "https://testnet-api.algonode.cloud/",
    indexerPort: "",
};

// Create an algod client
const algodClient =  new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort);

// Accounts
const fromAccountMnemonic = ""
const rekeyAccountMnemonic = "";

// Recover accounts from mnemonics
const fromAccount = algosdk.mnemonicToSecretKey(fromAccountMnemonic);
const rekeyAccount = algosdk.mnemonicToSecretKey(rekeyAccountMnemonic);

async function rekeyAccountExample() {
  try {
    // Get suggested transaction parameters
    const params = await algodClient.getTransactionParams().do();


    //  Rekey transaction 
    // const authTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject(
    //  {sender: fromAccount.addr,       // From address (original account)
    //   receiver: fromAccount.addr,       // To address (self-payment, as this is just a rekey transaction)
    //   amount :0,                      // Amount (0 because no funds are transferred)      
    //   suggestedParams: params,                 // Transaction parameters
    //   rekeyTo: "" }      //this should be your contract address}
    // );


    const authorizeMethod = new algosdk.ABIMethod( {
        "name": "app_optin",
        "args": [
            {
                "type": "account",
                "name": "address"
            },
            {
                "type": "uint64",
                "name": "appid"
            }
        ],
        "readonly": false,
        "returns": {
            "type": "void"
        }
    });

    const authTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: rekeyAccount.addr,
        appIndex:728649083,//728642289, //728593518,
        suggestedParams: { ...params, fee: 4000 },
        foreignApps:[724673015,724672975],
       appArgs: [authorizeMethod.getSelector(),new Uint8Array(Buffer.from([rekeyAccount])), algosdk.encodeUint64(724673015)],
       accounts:[fromAccount.addr]

    });

    // Sign the transaction with the original account's private key
    const signedTxn = authTxn.signTxn(rekeyAccount.sk);

    // Send the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction sent with txID:", txId);

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Transaction confirmed in round", confirmedTxn["confirmed-round"]);

    // Verify that rekeying worked
    const accountInfo = await algodClient.accountInformation(rekeyAccount.addr).do();
    if (accountInfo['auth-addr'] === rekeyAccount.addr) {
      console.log("Rekeying successful! New transaction manager is:", rekeyAccount.addr);
    } else {
      console.log("Rekeying failed. The original account still has control.");
    }

  } catch (error) {
    console.error("Failed to rekey account:", error);
  }
}

rekeyAccountExample();
