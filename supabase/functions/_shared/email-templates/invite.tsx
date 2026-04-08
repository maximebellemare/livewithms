/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to LiveWithMS 💌</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>💌</Text>
        <Heading style={h1}>You're invited!</Heading>
        <Text style={text}>
          You've been invited to join LiveWithMS. Click below to accept and set
          up your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invite
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
        <Text style={footerBrand}>
          LiveWithMS · Your data is encrypted and private
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const button = {
  backgroundColor: 'hsl(25, 85%, 50%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'block' as const,
  textAlign: 'center' as const,
  margin: '8px 0 24px',
}
const hr = { borderColor: '#f0ece8', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#777', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#999', margin: '0', textAlign: 'center' as const }
