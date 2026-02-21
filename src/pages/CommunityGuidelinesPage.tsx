import PageHeader from "@/components/PageHeader";
import { Link } from "react-router-dom";
import { Shield, Heart, MessageCircle, AlertTriangle, Users, ExternalLink, ChevronRight } from "lucide-react";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    {children}
  </div>
);

const Rule = ({ emoji, text }: { emoji: string; text: string }) => (
  <div className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
    <span className="shrink-0 text-base">{emoji}</span>
    <span>{text}</span>
  </div>
);

const CommunityGuidelinesPage = () => (
  <>
    <PageHeader title="Community Guidelines" subtitle="A safe space for the MS community" showBack />
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in pb-28">

      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent p-5 shadow-soft text-center space-y-2">
        <Heart className="h-8 w-8 text-primary mx-auto" />
        <h2 className="font-display text-lg font-semibold text-foreground">Welcome to our community</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Living with MS can feel isolating. This space is built so you never have to face it alone. Be kind, be honest, and look out for each other.
        </p>
      </div>

      {/* Core Rules */}
      <Section icon={Shield} title="Community Rules">
        <div className="space-y-3">
          <Rule emoji="🤝" text="Be respectful and empathetic. Everyone's MS journey is different — honour that." />
          <Rule emoji="🔒" text="Protect privacy. Never share someone else's personal or medical information." />
          <Rule emoji="🚫" text="No hate speech, discrimination, harassment, or bullying of any kind." />
          <Rule emoji="💊" text="Don't give medical advice. Share your experience, but always recommend consulting a doctor." />
          <Rule emoji="🛒" text="No spam, self-promotion, or selling products/services." />
          <Rule emoji="📸" text="Only share content you have permission to post. No copyrighted material." />
          <Rule emoji="🍷" text="No promotion of unproven treatments, recreational drugs, or dangerous practices." />
          <Rule emoji="✨" text="Keep it constructive. Vent when you need to, but aim to uplift rather than tear down." />
        </div>
      </Section>

      {/* Posting Guidelines */}
      <Section icon={MessageCircle} title="Posting Guidelines">
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>• <strong className="text-foreground">Post in the right channel</strong> — Choose the topic that best fits your post to help others find it.</p>
          <p>• <strong className="text-foreground">Use a clear title</strong> — Descriptive titles (max 200 characters) help the community engage with your post.</p>
          <p>• <strong className="text-foreground">Keep it concise</strong> — Posts can be up to 5,000 characters. Comments up to 2,000.</p>
          <p>• <strong className="text-foreground">Trigger warnings</strong> — If your post discusses sensitive topics (mental health struggles, grief, trauma), please add a content warning at the top.</p>
          <p>• <strong className="text-foreground">Stay on topic</strong> — This community is for MS-related discussions and support.</p>
        </div>
      </Section>

      {/* Moderation */}
      <Section icon={Users} title="How Moderation Works">
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>Our volunteer moderators help keep this space safe and welcoming. Here's what to expect:</p>
          <p>• <strong className="text-foreground">Reporting</strong> — Use the report button on any post or comment that breaks these guidelines. Reports are reviewed promptly.</p>
          <p>• <strong className="text-foreground">Content removal</strong> — Posts or comments that violate rules may be hidden from public view. The author will still be able to see their own hidden content.</p>
          <p>• <strong className="text-foreground">Repeat violations</strong> — Persistent rule-breaking may result in temporary or permanent account restrictions.</p>
          <p>• <strong className="text-foreground">Appeals</strong> — If you believe a moderation decision was made in error, reach out through the community support channels.</p>
        </div>
      </Section>

      {/* Crisis Resources */}
      <Section icon={AlertTriangle} title="Crisis & Safety Resources">
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you or someone in the community is in crisis, please reach out to professional support immediately. You are not alone.
        </p>
        <div className="space-y-2 pt-1">
          {[
            { name: "988 Suicide & Crisis Lifeline", desc: "Call or text 988 (US)", href: "tel:988" },
            { name: "Crisis Text Line", desc: "Text HOME to 741741", href: "sms:741741" },
            { name: "National MS Society", desc: "Resources & support", href: "https://www.nationalmssociety.org" },
            { name: "MS International Federation", desc: "Global support network", href: "https://www.msif.org" },
          ].map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 transition-colors hover:bg-secondary"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
      </Section>

      {/* Locked Channel Note */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">🔒 Emotional Crisis Support Channel</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Our community includes a dedicated, locked channel with pinned safety resources for members experiencing emotional distress. This channel is moderated with extra care.
        </p>
      </div>

      {/* Medical Disclaimer */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">⚕️ Medical Disclaimer</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          LiveWithMS is not a medical service. Content shared by community members reflects personal experiences and should never replace professional medical advice, diagnosis, or treatment. Always consult your neurologist or healthcare provider before making changes to your treatment plan.
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/community"
        className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <span>Join the conversation</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  </>
);

export default CommunityGuidelinesPage;
