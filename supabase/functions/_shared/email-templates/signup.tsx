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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to LiveWithMS – confirm your email 🧡</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🧡</Text>
        <Heading style={h1}>Welcome aboard!</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>LiveWithMS</strong>
          </Link>
          . We're glad you're here.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started tracking your health journey.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>
          LiveWithMS · Your data is encrypted and private
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(25, 85%, 50%)', textDecoration: 'underline' }
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
