import {
  setPayerAndBlockhashTransaction,
  signAndSendTransaction,
  WalletAdapter,
} from "./wallet";
import { serialize } from "borsh";
// @ts-ignore
import lo from "buffer-layout";
import {
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
  TransactionInstruction,
} from "@solana/web3.js";
import { programId } from "./program";

const V_TRANSACTION_ELEMENTS_COUNT = 20;
//export const DUMMY_TX_ID = "0000000000000000000000000000000000000000000";
// export const DUMMY_TX_ID = "                                           ";
// export const DUMMY_CREATED_ON = "0000000000000000";
export const DUMMY_TNX_DATE = "0000000000000000";
export const DUMMY_TNX_TYPE = "0"; // 'A' = Append Request, 'W' = Write Allow, 'R' = Read Request, 'G' Grant Read access
export const DUMMY_REF_DATE = "0000000000000000";
export const DUMMY_REQ_TYPE = "0"; // 'J' = Join, 'Q' = Quit, 'P' = Promoted
export const DUMMY_REQ_MESG = "                         ";  //25

export class VTransaction {
  // archive_id: string = DUMMY_TX_ID;
  // created_on: string = DUMMY_CREATED_ON; // max milliseconds in date
  tnx_date: string = DUMMY_TNX_DATE;
  txn_type: string = DUMMY_TNX_TYPE; 
  ref_date: string = DUMMY_REF_DATE;
  req_type: string = DUMMY_REQ_TYPE;
  req_mesg: string = DUMMY_REQ_MESG; 
  constructor(
    fields: { tnx_date: string; txn_type: string; ref_date: string; req_type: string; req_mesg: string } | undefined = undefined
  ) {
    if (fields) {
      // this.archive_id = fields.archive_id;
      // this.created_on = fields.created_on;
      this.tnx_date = fields.tnx_date;
      this.txn_type = fields.txn_type;
      this.ref_date = fields.ref_date;
      this.req_type = fields.req_type;
      this.req_mesg = fields.req_mesg;
    }
  }
}

const VTransactionSchema = new Map([
  [
    VTransaction,
    {
      kind: "struct",
      fields: [
        ["tnx_date", "String"],
        ["txn_type", "String"],
        ["ref_date", "String"],
        ["req_type", "String"],
        ["req_mesg", "String"],
      ],
    },
  ],
]);

class MessageService {
  V_TRANSACTIONS_SIZE: number = 0;
  setVTransactionsDataSize() {
    const sampleVTransactions: Array<VTransaction> =
      this.getDefaultVTransactions();

    let length = 0;
    for (let i = 0; i < sampleVTransactions.length; i++) {
      length += serialize(VTransactionSchema, sampleVTransactions[i]).length;
    }
    this.V_TRANSACTIONS_SIZE = length + 4; // plus 4 due to some data diffs between client and program
  }

  constructor() {
    this.setVTransactionsDataSize();
  }

  private getDefaultVTransactions(): Array<VTransaction> {
    const vTransations: Array<VTransaction> = [];
    for (let i = 0; i < V_TRANSACTION_ELEMENTS_COUNT; i++) {
      vTransations.push(new VTransaction());
    }

    return vTransations;
  }

  async getAccountMessageHistory(
    connection: Connection,
    pubKeyStr: string
  ): Promise<Array<VTransaction>> {
    const sentPubkey = new PublicKey(pubKeyStr);
    const sentAccount = await connection.getAccountInfo(sentPubkey);
    
    if (!sentAccount) {
      throw Error(`Account ${pubKeyStr} does not exist`);
    }

    const tnx_date = lo.cstr("tnx_date");
    const txn_type = lo.cstr("txn_type");
    const ref_date = lo.cstr("ref_date");
    const req_type = lo.cstr("req_type");
    const req_mesg = lo.cstr("req_mesg");
 





    const dataStruct = lo.struct(
      [lo.seq(lo.u8(), 2),tnx_date, lo.seq(lo.u8(), 2),txn_type, lo.seq(lo.u8(),2),
        ref_date, lo.seq(lo.u8(),2),req_type, lo.seq(lo.u8(),2),
        req_mesg,lo.seq(lo.u8(),2)],
      "VTransaction"
    );
    const ds = lo.seq(dataStruct, V_TRANSACTION_ELEMENTS_COUNT);
    const messages = ds.decode(sentAccount.data);
    return messages;
  }

  async getMessageSentHistory(
    connection: Connection,
    sentChatPubkeyStr: string
  ): Promise<Array<VTransaction>> {
    const messages = await this.getAccountMessageHistory(
      connection,
      sentChatPubkeyStr
    );
    console.log("getMessageSentHistory", messages);
    return messages;
  }

  async getMessageReceivedHistory(
    connection: Connection,
    walletChatPubkeyStr: string
  ): Promise<Array<VTransaction>> {
    const messages = await this.getAccountMessageHistory(
      connection,
      walletChatPubkeyStr
    );
    console.log("getMessageReceivedHistory", messages);
    return messages;
  }

  async sendMessage(
    connection: Connection,
    wallet: WalletAdapter,
    destPubkeyStr: string,
    txn_type: string, 
    ref_date: string, 
    req_type: string, 
    req_mesg: string
    //txid: string, 
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    console.log("start sendMessage");
    const destPubkey = new PublicKey(destPubkeyStr);

    const messageObj = new VTransaction();
    // messageObj.archive_id = this.getTxIdFromArweave(txid);
    // messageObj.created_on = this.getCreatedOn();
    messageObj.tnx_date = this.getCreatedOn();
    messageObj.txn_type = txn_type;
    messageObj.ref_date = ref_date
    messageObj.req_type = req_type;
    messageObj.req_mesg = this.getTransactionMessage(req_mesg);



    const messageInstruction = new TransactionInstruction({
      keys: [{ pubkey: destPubkey, isSigner: false, isWritable: true }],
      programId,
      data: Buffer.from(serialize(VTransactionSchema, messageObj)),
    });
    const trans = await setPayerAndBlockhashTransaction(wallet,messageInstruction);
    const signature = await signAndSendTransaction(wallet, trans);
    const result = await connection.confirmTransaction(
      signature,
      "singleGossip"
    );
    console.log("end sendMessage", result);
    return result;
  }


  private getTransactionMessage(newTxId: string): string {
    // save message to arweave and get back txid;
    let txid = "";
    const dummyLength = DUMMY_REQ_MESG.length - newTxId.length;
    for (let i = 0; i < dummyLength; i++) {
      txid += " ";
    }
    txid = newTxId + txid;
    console.log("getTxIdFromArweave", txid);
    return txid;
  }


  // get value and add dummy values
  private getCreatedOn(): string {
    const now = Date.now().toString();
    console.log("now", now);
    const total = DUMMY_TNX_DATE.length;
    const diff = total - now.length;
    let prefix = "";
    for (let i = 0; i < diff; i++) {
      prefix += "0";
    }
    const created_on = prefix + now;
    console.log("created_on", created_on);
    return created_on;
  }
}

const messageService = new MessageService();
export default messageService;
