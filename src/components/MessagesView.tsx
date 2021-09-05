import React, { FC, useEffect, useState } from "react";
import { format } from "date-fns";
import "./MessagesView.css";
import { VTransaction } from "../solana/messages";
// import arweaveService from "../arweave/arweave";

interface MessagesViewProps {
  messages: Array<MessageItemViewProps>;
}
const MessagesView: FC<MessagesViewProps> = ({ messages }) => {
  const [viewItems, setViewItems] = useState<Array<JSX.Element | undefined>>();

  useEffect(() => {
    const sortedMessages = messages.sort((left, right) => {
      const leftCreatedOn = left.tnx_date.replace("+", "");
      const rightCreatedOn = right.tnx_date.replace("+", "");
      if (leftCreatedOn > rightCreatedOn) return 1;
      if (leftCreatedOn < rightCreatedOn) return -1;
      return 0;
    });

    let index = 0;
    const views = sortedMessages.map((msg) => {
      index += 1;
      return (
        <MessageItemView
          key={`msg-item-key-${index}`}
          tnx_date={msg.tnx_date}
          txn_type={msg.txn_type}
          ref_date={msg.ref_date}
          req_type={msg.req_type}
          req_mesg={msg.req_mesg}
          sent={msg.sent}
        />
      );
    });
    setViewItems(views);
  }, [messages]);

  return <>{viewItems}</>;
};
export default MessagesView;

export class MessageItemViewProps {
  constructor(
    public tnx_date: string,
    public txn_type: string,
    public ref_date: string,
    public req_type: string,
    public req_mesg: string,
    public sent: boolean
  ) {}
}
const MessageItemView: FC<MessageItemViewProps> = ({
  tnx_date,
  txn_type,
  ref_date,
  req_type,
  req_mesg,
  sent,
}) => {
  try {
    //if (!message) return null;

    let finalCreatedOn = "";
    for (let i = 0; i < tnx_date.length; i++) {
      if (Number(tnx_date[i]) > 0 || Number(finalCreatedOn) > 0) {
        finalCreatedOn += tnx_date[i];
      }
    }
    if (!finalCreatedOn || finalCreatedOn.length <= 2) return null;

    console.log("finalCreatedOn", finalCreatedOn);
    //console.log("date", new Date(Number(finalCreatedOn)).toUTCString());
    const createdOnDate = format(
      new Date(Number(finalCreatedOn)),
      "MM/dd/yy hh:mm:ss"
    );

    const referenceDate = format(
      new Date(Number(ref_date)),
      "MM/dd/yy hh:mm:ss"
    );


    const sentOrReceivedClass = sent
      ? "messages-view-sent"
      : "messages-view-received";

    return (
      <div className={`panel messages-view-container ${sentOrReceivedClass}`}>
        <label>{createdOnDate}</label>
        <div>
          <p>{txn_type}</p>
          <p>{referenceDate}</p>
          <p>{req_type}</p>
          <p>{req_mesg}</p>
        </div>
      </div>
    );
  } catch (err) {
    console.log(err);
    return null;
  }
};

export async function createMessageProps(
  messages: Array<VTransaction>,
  sent: boolean
): Promise<Array<MessageItemViewProps>> {
  messages.forEach((msg) => {
    //msg.archive_id = msg.archive_id.replace("+", "");
    //msg.archive_id = msg.archive_id.replace(/[\u0010]/g, "");
    msg.tnx_date = msg.tnx_date.replace("+", "");
  });



  const filteredMessages = messages.filter(
    (msg) =>
      msg.tnx_date &&
      msg.txn_type &&
      msg.ref_date &&
      msg.req_type &&
      msg.req_mesg &&
      !isAllZero(msg.tnx_date) &&
      !isAllZero(msg.txn_type) &&
      !isAllZero(msg.ref_date) &&
      !isAllZero(msg.req_type) &&
      !isAllBlank(msg.req_mesg) 
  );

  class ArweaveData {
  constructor(public tnx_date: string, public txn_type: string, public ref_date: string, public req_type: string, public req_mesg: string) {}
}

  console.log("filteredMessages", filteredMessages);
  //const arweaveData = await arweaveService.getData(filteredMessages);
  const arweaveData: Array<ArweaveData> = [];
  for (let i = 0; i < filteredMessages.length; i++) {
    const chatMessage = filteredMessages[i];
    // console.log("tnx_date", chatMessage.tnx_date);
    // console.log("txn_type", chatMessage.txn_type);
    // console.log("ref_date", chatMessage.ref_date);
    // console.log("req_type", chatMessage.req_type);
    // console.log("req_mesg", chatMessage.req_mesg);
    arweaveData.push(
      new ArweaveData(chatMessage.tnx_date, chatMessage.txn_type,
                      chatMessage.ref_date, chatMessage.req_type,
                      chatMessage.req_mesg)
    );

  }
  
  const messageProps = arweaveData.map((msg) => {
    return new MessageItemViewProps(msg.tnx_date, msg.txn_type, msg.ref_date, msg.req_type, msg.req_mesg, sent);
  });
  
  return messageProps;
}

function isAllZero(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== "0") {
      return false;
    }
  }
  return true;
}

function isAllBlank(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== " ") {
      return false;
    }
  }
  return true;
}
