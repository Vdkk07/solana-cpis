import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { expect, test } from "bun:test";
import { LiteSVM } from "litesvm";

test("CPI works as expected", () =>{
    let svm = new LiteSVM()
    let doubleContractPubkey = PublicKey.unique()
    let cpiContractPubkey =  PublicKey.unique()
    svm.addProgramFromFile(doubleContractPubkey, "./double.so");
    svm.addProgramFromFile(cpiContractPubkey, "./cpi-solana.so");

    let payer = new Keypair()
    let dataAccount = new Keypair();
    
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL))

    createDataAccOnChain(svm, dataAccount, payer, doubleContractPubkey)

    function doubleIt(){
        const ix2 = new TransactionInstruction({
            keys: [
                { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
                { pubkey: doubleContractPubkey, isSigner: false, isWritable: false },
            ],
            programId: cpiContractPubkey,
            data: Buffer.from(""),
        }); 
        
        const tx2 = new Transaction();
        const blockhash = svm.latestBlockhash(); 
        tx2.recentBlockhash = blockhash;
        tx2.feePayer = payer.publicKey;
        tx2.add(ix2);
        tx2.sign(payer);
        svm.sendTransaction(tx2);
        svm.expireBlockhash();

    }
    doubleIt();
    doubleIt();
    doubleIt();
    doubleIt();

    const updatedDataAcc = svm.getAccount(dataAccount.publicKey);
    console.log(updatedDataAcc?.data);
    expect(updatedDataAcc?.data[0]).toBe(8);
    expect(updatedDataAcc?.data[2]).toBe(0);
    expect(updatedDataAcc?.data[1]).toBe(0);
    expect(updatedDataAcc?.data[3]).toBe(0);
})

function createDataAccOnChain(svm : LiteSVM, dataAccount: Keypair, payer: Keypair, contractPubKey: PublicKey){
  const blockhash = svm.latestBlockhash();
  const ixs = [
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: dataAccount.publicKey,
      lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
      space: 4,
      programId: contractPubKey,
    }),
  ];
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  tx.add(...ixs);
  tx.sign(payer, dataAccount);
  svm.sendTransaction(tx)
}