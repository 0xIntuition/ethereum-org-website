import { Badge, useColorMode } from "@chakra-ui/react"
import React from "react"
import styled from "@emotion/styled"
import { useAccount } from "wagmi"
import { ConnectKitButton } from "connectkit"
import {
  ZkConnect,
  ZkConnectClientConfig,
  DataRequest,
} from "@sismo-core/zk-connect-client"

// Represent string as 32-bit integer
const hashCode = (string) => {
  let hash = 0
  for (const char of string) {
    const code = char.charCodeAt(0)
    hash = (hash << 5) - hash + code
    hash |= 0
  }
  return Math.abs(hash)
}

// Theme variables from Theme.js
const colors = [
  "tagBlue",
  "tagOrange",
  "tagGreen",
  "tagRed",
  "tagTurquoise",
  "tagGray",
  "tagYellow",
  "tagMint",
  "tagPink",
] as const

const AttestationBadgeWrapper = styled("div")`
  transition: all 0.2s ease-in-out;
  margin-right: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 1rem;
  padding: 0.2rem 0.5rem;
  background: #ffffff;
  border: #e5e5e5 1px solid;
  ${(props) =>
    props.userVoted
      ? `
      border-color: rgb(74 222 128);
      background-color: rgb(220 252 231);
      pointer-events: none;
      cursor: default;
  `
      : `
      cursor: pointer;
      &:hover {
        border-color: rgb(74 222 128);
        background-color: rgb(220 252 231);
      }
  `}
  ${(props) =>
    props.loading &&
    `
    opacity: 40%
    cursor: default;
    pointer-events: none;
  `}
`

const AttestationBadgeNumber = styled("div")`
  margin-right: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
`

const BadgeInput = styled("input")`
  background: transparent;
  &:focus {
    outline: none;
  }
`

const TutorialAttestationsWrapper = styled("div")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
`

export interface IProps {
  toggleAttested: (attestation: string) => void
  attestations: Array<string>
}

const TutorialAttestations: React.FC<IProps> = ({
  attestations: tags,
  toggleAttested,
}) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDarkTheme = colorMode === "dark"
  const { address } = useAccount()
  return (
    <TutorialAttestationsWrapper>
      {tags.map((tag, idx) => {
        return (
          <AttestationBadgeWrapper
            userVoted={Math.random() < 0.5}
            loading={Math.random() < 0.5}
            onClick={() => toggleAttested(tag)}
            key={idx}
          >
            {tag} • 42412
          </AttestationBadgeWrapper>
        )
      })}
      {address ? (
        <BadgeInput type="text" placeholder="Add attestation" />
      ) : (
        <ConnectKitButton mode={isDarkTheme ? "dark" : "light"} />
      )}
    </TutorialAttestationsWrapper>
  )
}

export default TutorialAttestations
