/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your LiveWithMS verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🔑</Text>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
        <Text style={footerBrand}>
          LiveWithMS · Your data is encrypted and private
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const emoji = { fontSize: '40px', textAlign: 'center' as const, margin: '0 0 8px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#121212',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#404040',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const codeStyle = {
  fontFamily: "'DM Sans', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: 'hsl(25, 85%, 50%)',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
}
const hr = { borderColor: '#f0ece8', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#777', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#999', margin: '0', textAlign: 'center' as const }
