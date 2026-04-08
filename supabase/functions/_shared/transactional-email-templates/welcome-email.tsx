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

import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'LiveWithMS'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to LiveWithMS – your health companion 🧡</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🧡</Text>
        <Heading style={h1}>
          {name ? `Welcome, ${name}!` : 'Welcome to LiveWithMS!'}
        </Heading>
        <Text style={text}>
          We're so glad you're here. LiveWithMS is your personal companion for
          tracking symptoms, managing medications, and understanding your
          health journey — all in one place.
        </Text>
        <Text style={text}>Here's what you can do to get started:</Text>
        <Text style={listItem}>📊 <strong>Track your symptoms</strong> daily to spot patterns</Text>
        <Text style={listItem}>💊 <strong>Log medications</strong> and set reminders</Text>
        <Text style={listItem}>📝 <strong>Journal</strong> your thoughts and feelings</Text>
        <Text style={listItem}>🤝 <strong>Connect</strong> with the MS community</Text>
        <Button style={button} href="https://app.livewithms.com/today">
          Get Started
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Need help? We're here for you —{' '}
          <Link href="mailto:support@livewithms.com" style={link}>
            support@livewithms.com
          </Link>
        </Text>
        <Text style={footerBrand}>
          {SITE_NAME} · Your data is encrypted and private
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to LiveWithMS – your health companion 🧡',
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

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
const listItem = {
  fontSize: '15px',
  color: '#404040',
  lineHeight: '1.6',
  margin: '0 0 8px',
  paddingLeft: '4px',
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
  margin: '16px 0 24px',
}
const hr = { borderColor: '#f0ece8', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#777', margin: '0 0 8px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#999', margin: '0', textAlign: 'center' as const }
