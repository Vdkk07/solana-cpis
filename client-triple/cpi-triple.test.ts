import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { test, expect } from "bun:test";
import { LiteSVM } from "litesvm";

test("cpi test", () => {
  let svm = new LiteSVM();
  let cpiContractPubkey = PublicKey.unique();
  let tripleContractPubKey = PublicKey.unique();

  svm.addProgramFromFile(cpiContractPubkey, "./cpi-solana.so");
  svm.addProgramFromFile(tripleContractPubKey, "./triple-contract.so");

  let payer = new Keypair()
  let dataAcc = new Keypair()

  svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL * 2))

  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: dataAcc.publicKey,
      lamports: Number(svm.minimumBalanceForRentExemption(BigInt(4))),
      space: 4,
      programId: tripleContractPubKey,
    })
  );

  tx1.recentBlockhash = svm.latestBlockhash()
  tx1.feePayer = payer.publicKey
  tx1.sign(payer,dataAcc)
  svm.sendTransaction(tx1)
  svm.expireBlockhash()

  function doubleIt(){
    const ixs = new TransactionInstruction({
        keys: [
        {
            pubkey: dataAcc.publicKey,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: tripleContractPubKey,
            isSigner: false,
            isWritable: false,
        },
        ],
        programId: cpiContractPubkey,
        data: Buffer.from("")
    });

    const tx2 =  new Transaction().add(ixs)
    tx2.recentBlockhash = svm.latestBlockhash();
    tx2.feePayer = payer.publicKey;
    tx2.sign(payer);
    svm.sendTransaction(tx2);
    svm.expireBlockhash();
  }

   doubleIt();
   doubleIt();
   doubleIt();
   doubleIt();

   let updatedDataAcc = svm.getAccount(dataAcc.publicKey);
   console.log(updatedDataAcc?.data);

   expect(updatedDataAcc?.data[0]).toBe(27);
   expect(updatedDataAcc?.data[2]).toBe(0);
   expect(updatedDataAcc?.data[1]).toBe(0);
   expect(updatedDataAcc?.data[3]).toBe(0);

});
