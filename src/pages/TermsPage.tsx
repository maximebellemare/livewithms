import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ChevronLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using LiveWithMS (the \"App\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.",
  },
  {
    title: "2. Description of Service",
    body: "LiveWithMS is a personal wellness companion designed to help individuals living with Multiple Sclerosis track symptoms, medications, appointments, and overall well-being. The App is not a medical device and does not provide medical advice, diagnosis, or treatment.",
  },
  {
    title: "3. Medical Disclaimer",
    body: "The App is for informational purposes only. Always seek the advice of your neurologist or other qualified healthcare provider with any questions regarding your medical condition. Never disregard professional medical advice or delay seeking it because of something you have read or tracked in this App.",
  },
  {
    title: "4. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.",
  },
  {
    title: "5. Privacy & Data",
    body: "Your health data is encrypted and stored securely. We do not sell or share your personal health information with third parties. You retain full ownership of your data and can export or delete it at any time from the Privacy & Data settings.",
  },
  {
    title: "6. Acceptable Use",
    body: "You agree not to misuse the App, including but not limited to: attempting to access other users' data, interfering with the App's operation, posting harmful content in community features, or using the App for any unlawful purpose.",
  },
  {
    title: "7. Community Guidelines",
    body: "Participation in community features is subject to our Community Guidelines. We reserve the right to remove content and restrict access for users who violate these guidelines.",
  },
  {
    title: "8. Intellectual Property",
    body: "All content, features, and functionality of the App — including text, graphics, logos, and software — are the property of LiveWithMS and are protected by applicable intellectual property laws.",
  },
  {
    title: "9. Limitation of Liability",
    body: "To the fullest extent permitted by law, LiveWithMS and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App. The App is provided \"as is\" without warranties of any kind.",
  },
  {
    title: "10. Changes to Terms",
    body: "We may update these Terms of Service from time to time. Continued use of the App after changes constitutes acceptance of the updated terms. We will notify users of significant changes through the App.",
  },
  {
    title: "11. Termination",
    body: "We reserve the right to suspend or terminate your access to the App at any time for violations of these terms. You may delete your account and data at any time through the Privacy & Data settings.",
  },
  {
    title: "12. Contact",
    body: "If you have questions about these Terms of Service, please reach out through the App's support channels.",
  },
];

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Terms of Service" showBack />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-display text-base font-semibold text-foreground">LiveWithMS Terms of Service</h2>
          </div>
          <p className="text-xs text-muted-foreground">Last updated: February 2026</p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="rounded-xl bg-card p-4 shadow-soft space-y-2">
            <h3 className="font-display text-sm font-semibold text-foreground">{section.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}

        <p className="text-center text-[10px] text-muted-foreground pb-8">
          ⚕️ This app does not provide medical advice. Always consult your healthcare provider.
        </p>
      </div>
    </>
  );
};

export default TermsPage;
