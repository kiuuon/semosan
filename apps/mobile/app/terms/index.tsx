import LegalDocumentScreen from '../../components/legal/LegalDocumentScreen';
import { TERMS_OF_SERVICE } from '../../lib/data/legal';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title={TERMS_OF_SERVICE.title}
      effectiveDate={TERMS_OF_SERVICE.effectiveDate}
      intro={TERMS_OF_SERVICE.intro}
      sections={TERMS_OF_SERVICE.sections}
    />
  );
}
