import { Chat, MoreVert, Logout, Search } from "@mui/icons-material"
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Tooltip } from "@mui/material"
import { signOut } from "firebase/auth"
import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import styled from "styled-components"
import { auth, db } from "../config/firebase"
import * as EmailValidator from "email-validator"
import { addDoc, collection, query, where } from "firebase/firestore"
import { useCollection } from "react-firebase-hooks/firestore"
import { Conversation } from "../types"
import ConversationSelect from "./ConversationSelect"

const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
  display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
`

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
`

const StyledSearch = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 2px;

`

const StyledSearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
`

const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`

const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

const Sidebar = () => {

  const [loggedInUser, _loading, _error] = useAuthState(auth)

  const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] = useState(false)

  const [recipientEmail, setRecipientEmail] = useState('')

  const toggleNewConversationDialog = (isOpen: boolean) => {
    setIsOpenNewConversationDialog(!isOpen)

    if (!isOpen) {
      setRecipientEmail('')
    }
  }

  const closeNewConversationDialog = () => {
    toggleNewConversationDialog(true)
  }

  // check if conversation already exists between the current logged in user and recipient
  const queryGetConversationsForCurrentUser = query(collection(db, 'conversations'), where('users', 'array-contains', loggedInUser?.email))
  const [conversationsSnapshot, __loading, __error] = useCollection(queryGetConversationsForCurrentUser)

  const isConversationAlreadyExist = (recipientEmail: string) => {
    return conversationsSnapshot?.docs.find(conversation => (conversation.data() as Conversation).users.includes(recipientEmail))
  }

  const isInvitingSelf = recipientEmail === loggedInUser?.email

  const createConversation = async () => {
    if (!recipientEmail) {
      return
    }

    if (EmailValidator.validate(recipientEmail) && 
      !isInvitingSelf && 
      !isConversationAlreadyExist(recipientEmail)
    ) {
      // add conversation user to db "conversations" collection
      // A conversation is between the currently logged in user and the use invited

      await addDoc(collection(db, 'conversations'), {
        users: [loggedInUser?.email, recipientEmail]
      })
    }

    closeNewConversationDialog();
  }

  const logOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.log('Error loging out', error);
    }
  }

  return (
    <StyledContainer>
      <StyledHeader>
        <Tooltip title={loggedInUser?.email as string} placement="right">
          <StyledUserAvatar src={loggedInUser?.photoURL || ''} />
        </Tooltip>

        <div>
          <IconButton>
            <Chat />
          </IconButton>
          <IconButton>
            <MoreVert />
          </IconButton>
          <IconButton onClick={logOut}>
            <Logout />
          </IconButton>
        </div>
      </StyledHeader>

      <StyledSearch>
        <Search />
        <StyledSearchInput placeholder="Search in conversations" />
      </StyledSearch>

      <StyledSidebarButton onClick={() => {
        toggleNewConversationDialog(false);
      }}>START A NEW CONVERSATION</StyledSidebarButton>

      {/* List of conversations */}
      {conversationsSnapshot?.docs.map(conversation => (
        <ConversationSelect 
          key={conversation.id}
          id={conversation.id}
          conversationUsers={(conversation.data() as Conversation).users}
        />
      ))}

      <Dialog open={isOpenNewConversationDialog} onClose={closeNewConversationDialog}>
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a Google email address for the user you wish to chat with.
          </DialogContentText>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={recipientEmail}
            onChange={event => {
              setRecipientEmail(event.target.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNewConversationDialog}>Cancel</Button>
          <Button disabled={!recipientEmail} onClick={createConversation}>Create</Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  )
}

export default Sidebar
