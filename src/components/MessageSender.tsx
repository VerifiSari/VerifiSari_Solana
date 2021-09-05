import { Connection } from "@solana/web3.js";
import React, { FC, useState } from "react";
import messageService from "../solana/messages";
import { WalletAdapter } from "../solana/wallet";
import "./MessageSender.css";

interface MessageSenderProps {
  connection?: Connection;
  wallet?: WalletAdapter;
  destPubkeyStr: string;
  getMessages: () => void;
}

const MessageSender: FC<MessageSenderProps> = ({
  connection,
  wallet,
  destPubkeyStr,
  getMessages,
}) => {


  // const [t_tnx_date, set_tnx_date] = useState("");
  const [t_txn_type, set_txn_type] = useState("");
  const [t_ref_date, set_ref_date] = useState("");
  const [t_req_type, set_req_type] = useState("");
  const [t_req_mesg, set_req_mesg] = useState("");
  //const [message, setMessage] = useState("");


  const onChangeTxnType = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_txn_type(e.target.value ? e.target.value.toString() : "");
  };
  const onChangeRefDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_ref_date(e.target.value ? e.target.value.toString() : "");
  };
  const onChangeReqType = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_req_type(e.target.value ? e.target.value.toString() : "");
  };
  const onChangeReqMesg = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_req_mesg(e.target.value ? e.target.value.toString() : "");
  };
  
  // const onChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMessage(e.target.value);};

  const onClickSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (!connection || !wallet) {
      return;
    }

    // 1 save message to arweave
    //const txid = message ;//await arweaveService.saveData(message);
    console.log("saved t_txn_type", t_txn_type);
    console.log("saved t_ref_date", t_ref_date);
    console.log("saved t_req_type", t_req_type);
    console.log("saved t_req_mesg", t_req_mesg);



    // 2 save arweave txid to solana
    const result = await messageService.sendMessage(
      connection,
      wallet,
      destPubkeyStr,
      t_txn_type, 
      t_ref_date, 
      t_req_type,
      t_req_mesg
    );
    console.log("onClickSubmit message sent successfully", result);
    getMessages();
  };

  return (
    <form className="send-container">
      <div className="send-inputs">
        <div className="send-top-left">
          <label htmlFor="address">Trasaction Type 'A' = Append Request, 'W' = Write Allow, 'R' = Read Request, 'G' Grant Read access</label>
        </div>
        <div className="send-mid1-left">
          <label htmlFor="address">Reference Date (Date of thing happeing)</label>
        </div>
        <div className="send-mid2-left">
          <label htmlFor="address">Request type 'J' = Join, 'Q' = Quit, 'P' = Promoted (Only for A and W TT)</label>
        </div>
        <div className="send-mid3-left">
          <label htmlFor="address">Message (20 character limit)</label>
        </div>
        <div className="send-top-right">
          <input type="text" value={t_txn_type} onChange={onChangeTxnType} />
        </div>
        <div className="send-mid1-right">
          <input type="text" value={t_ref_date} onChange={onChangeRefDate} />
        </div>
        <div className="send-mid2-right">
          <input type="text" value={t_req_type} onChange={onChangeReqType} />
        </div>
        <div className="send-mid3-right">
          <input type="text" value={t_req_mesg} onChange={onChangeReqMesg} />
        </div>
        <div className="send-bottom-right">
          <button onClick={onClickSubmit}>Submit</button>
        </div>
      </div>
    </form>
  );
};

export default MessageSender;
//   <div className="panel">
//   <input
//     className="msg-input"
//     type="text"
//     value={message}
//     onChange={onChangeMessage}
//   />
//   <button onClick={onClickSubmit}>Submit</button>
// </div>