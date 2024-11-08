
const algosdk = require('algosdk');

// Configure Algod client
const config = {
    algodToken: "",
    algodServer: "https://testnet-api.algonode.cloud/",
    algodPort: "",
    indexerToken: "",
    indexerServer: "https://testnet-api.algonode.cloud/",
    indexerPort: "",
};
const client = new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort);


const appId = 724672975;    
const asaId = 724672990;    


const userMnemonic = "";
const userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

const tealSource = `
#pragma version 9
txn RekeyTo
global ZeroAddress
==
assert
txn AssetCloseTo
global ZeroAddress
==
assert
txn TypeEnum
pushint 4
==
assert
txn XferAsset
pushint 724672990
==
assert
txn Fee
pushint 0
==
assert
pushint 1
`;


// Compile the TEAL program
async function compileTeal(client, source) {
    const compiled = await client.compile(source).do();
    return new Uint8Array(Buffer.from(compiled.result, 'base64'));
}

// Opt-in function
async function optInWithASA() {
    try {
        // Compile the TEAL code to create the LogicSig
        const programBytes = await compileTeal(client, tealSource);
        const logicSig = new algosdk.LogicSigAccount(programBytes);

        const suggestedParams = await client.getTransactionParams().do();
        suggestedParams.fee = 2000; 
        suggestedParams.flatFee = true;    
       
        const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: logicSig.address(),
            receiver: userAccount.addr,
            amount: 1,    
            assetIndex: asaId,
            suggestedParams: { ...suggestedParams, fee: 0 }, 
            revocationTarget: userAccount.addr,
            assetSender: ""
           
        });

       
        const txn2 = algosdk.makeApplicationOptInTxnFromObject({
            sender: userAccount.addr,
            appIndex: appId,
            suggestedParams: { ...suggestedParams, fee: 4000 },
            foreignApps: [724672968],    
            foreignAssets: [asaId],
        });


        algosdk.assignGroupID([txn1, txn2]);


        const signedTxn1 = algosdk.signLogicSigTransactionObject(txn1, logicSig);
        const signedTxn2 = txn2.signTxn(userAccount.sk);

        const signedGroup = [signedTxn1.blob, signedTxn2];
        const { txId } = await client.sendRawTransaction(signedGroup).do();

        console.log("Transaction successful with txID: ", txId);

    } catch (error) {
        console.error("Error in opt-in process: ", error);
    }
}

// Run the function
optInWithASA();
