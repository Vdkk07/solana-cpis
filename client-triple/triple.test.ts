import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {test , expect} from "bun:test"
import { LiteSVM } from "litesvm"


test('triple contractPubKey', () => { 
    let svm = new LiteSVM();
    const tripleContractPubKey = PublicKey.unique()
    svm.addProgramFromFile(tripleContractPubKey, "./triple-contract.so");
    let payer = new Keypair()
    svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL * 2))
    let dataAcc = new Keypair()

    const ix1 = [
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: dataAcc.publicKey,
        lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
        space: 4,
        programId: tripleContractPubKey
      }),
    ];

    const tx = new Transaction()
    tx.recentBlockhash = svm.latestBlockhash()
    tx.feePayer = payer.publicKey
    tx.add(...ix1)
    tx.sign(payer, dataAcc)
    svm.sendTransaction(tx)
    svm.expireBlockhash()

    function doubleIt(){
      const ix2 = new TransactionInstruction({
        keys: [
          {
            pubkey: dataAcc.publicKey,
            isSigner: false,
            isWritable: true,
          },
        ],
        programId: tripleContractPubKey,
        data: Buffer.from(""),
      });
          
      const tx2 = new Transaction().add(ix2)
      tx2.recentBlockhash = svm.latestBlockhash()
      tx2.feePayer = payer.publicKey;
      tx2.sign(payer)
      svm.sendTransaction(tx2)
      svm.expireBlockhash()
    } 

    doubleIt()
    doubleIt();
    doubleIt();
    doubleIt();

    let updatedDataAcc = svm.getAccount(dataAcc.publicKey)
    console.log(updatedDataAcc?.data);

    expect(updatedDataAcc?.data[0]).toBe(27);
    expect(updatedDataAcc?.data[2]).toBe(0);
    expect(updatedDataAcc?.data[1]).toBe(0);
    expect(updatedDataAcc?.data[3]).toBe(0);
    
    
 })