import LegalDocumentScreen from '../../components/legal/LegalDocumentScreen';
import { PRIVACY_POLICY } from '../../lib/data/legal';

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title={PRIVACY_POLICY.title}
      effectiveDate={PRIVACY_POLICY.effectiveDate}
      intro={PRIVACY_POLICY.intro}
      sections={PRIVACY_POLICY.sections}
    />
  );
}
