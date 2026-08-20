import { ScrollView, StyleSheet, View } from 'react-native';

import Header from '../common/header/Header';
import Typography from '../common/typography/Typography';
import colors from '../../lib/constants/colors';
import type { LegalSection } from '../../lib/data/legal';

type Props = {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalDocumentScreen({ title, effectiveDate, intro, sections }: Props) {
  return (
    <View style={styles.root}>
      <Header title={title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography.Caption color={colors.stone500}>시행일: {effectiveDate}</Typography.Caption>
        <Typography.BodyBase color={colors.stone700}>{intro}</Typography.BodyBase>

        {sections.map((section) =>
          section.kind === 'chapter' ? (
            <View key={section.title} style={styles.chapter}>
              <Typography.HeadingMd>{section.title}</Typography.HeadingMd>
            </View>
          ) : (
            <View key={section.title} style={styles.article}>
              <Typography.BodyMedium color={colors.stone900}>{section.title}</Typography.BodyMedium>
              {(section.paragraphs ?? []).map((paragraph) => (
                <Typography.BodyBase key={paragraph} color={colors.stone700}>
                  {paragraph}
                </Typography.BodyBase>
              ))}
            </View>
          ),
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  chapter: {
    marginTop: 8,
    paddingTop: 8,
  },
  article: {
    gap: 6,
  },
});
