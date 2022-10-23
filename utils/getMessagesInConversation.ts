import { collection, DocumentData, orderBy, query, QueryDocumentSnapshot, Timestamp, where } from "firebase/firestore"
import { db } from "../config/firebase"
import { IMessage } from "../types"

export const generateQueryGetMessages = (conversationId?: string) => {
  return query(
    collection(db, 'messages'),
    where('conversationID', '==', conversationId),
    orderBy('sentAt', 'asc')
  )
}

export const transformMessage = (messageDoc: QueryDocumentSnapshot<DocumentData>): IMessage => {
  return {
    id: messageDoc.id,
    // ...messageDoc.data(), // spread our conversationID, text, sentAt, user
    conversation_id: messageDoc.data().conversationID,
    sent_at: messageDoc.data().sentAt ? convertFireStoreTimestampToString(messageDoc.data().sentAt as Timestamp) : null,
    text: messageDoc.data().text,
    user: messageDoc.data().user
  }
}

export const convertFireStoreTimestampToString = (timestamp: Timestamp) => new Date(timestamp.toDate().getTime()).toLocaleString()
