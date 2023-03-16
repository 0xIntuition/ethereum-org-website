import { Badge } from "@chakra-ui/react"
import React from "react"

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
  "attestationBlue",
  "attestationOrange",
  "attestationGreen",
  "attestationRed",
  "attestationTurquoise",
  "attestationGray",
  "attestationYellow",
  "attestationMint",
  "attestationPink",
] as const

export interface IProps {
  attestations: Array<string>
}

const Tutorialattestations: React.FC<IProps> = ({ attestations }) => {
  return (
    <>
      {attestations.map((attestation, idx) => {
        const attestationColorIdx = hashCode(attestation) % colors.length
        const attestationColor = colors[attestationColorIdx]
        return (
          <Badge key={idx} me={2} mb={2} background={attestationColor}>
            {attestation}
          </Badge>
        )
      })}
    </>
  )
}

export default Tutorialattestations
