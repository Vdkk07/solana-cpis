import { expect, test } from "bun:test";
import { LiteSVM } from "litesvm";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";

test("one transfer", () => {
  const svm = new LiteSVM();
  const contractPubKey = PublicKey.unique();
  // loading our contract to the local svm
  svm.addProgramFromFile(
    contractPubKey,
    "../target/deploy/w_36_cpi_in_solana.so"
  );
  const payer = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
  const dataAccount = new Keypair();
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
  svm.sendTransaction(tx);
  svm.expireBlockhash(); // Simulates expiration of recent blockhash in test environment
  const balanceAfter = svm.getBalance(dataAccount.publicKey);
  expect(balanceAfter).toBe(svm.minimumBalanceForRentExemption(BigInt(4)));

  // doubleIt function
  function doubleIt() {
    const blockhash = svm.latestBlockhash();

    const ix2 = new TransactionInstruction({
      keys: [
        { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
      ],
      programId: contractPubKey,
      data: Buffer.from(""),
    });

    const tx2 = new Transaction();
    tx2.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
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
});
