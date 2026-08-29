import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import colors from '../../lib/constants/colors';
import useAuth from '../../lib/hooks/useAuth';
import useRequireAuth from '../../lib/hooks/useRequireAuth';
import { getMe, logout } from '../../lib/apis/auth';
import Typography from '../common/typography/Typography';
import ContactInquiryModal from './ContactInquiryModal';

interface MyPanelProps {
  onNavigate?: () => void;
}

function MyPanel({ onNavigate }: MyPanelProps) {
  const { accessToken } = useAuth();
  const { navigateWithAuth } = useRequireAuth();
  const queryClient = useQueryClient();
  const [isContactOpen, setIsContactOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ['me'] });
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/');
    },
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!accessToken,
  });

  const handleNavigate = (
    href: '/auth' | '/edit-my-info' | '/my-trips' | '/invite-code' | '/terms' | '/privacy' | '/licenses',
  ) => {
    onNavigate?.();
    if (href === '/edit-my-info' || href === '/my-trips' || href === '/invite-code') {
      navigateWithAuth(href);
      return;
    }
    router.push(href);
  };

  return (
    <View style={styles.container}>
      {accessToken ? (
        <View style={styles.headingSection}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <MaterialCommunityIcons name="hiking" size={32} color={colors.stone300} />
            </View>
            <View style={styles.profileInfo}>
              <Typography.HeadingMd ellipsis>{user?.nickname}</Typography.HeadingMd>
              <Typography.Caption color={colors.stone700} ellipsis>
                {user?.email}
              </Typography.Caption>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loginSection}>
          <View>
            <TouchableOpacity onPress={() => handleNavigate('/auth')} style={styles.loginButton}>
              <Typography.HeadingLg>로그인 · 회원가입</Typography.HeadingLg>
              <Ionicons name="chevron-forward" size={18} color={colors.stone300} />
            </TouchableOpacity>
            <Typography.Caption color={colors.stone500}>로그인하고 나만의 산행을 기록해 보세요.</Typography.Caption>
          </View>
        </View>
      )}
      <View style={styles.listContainer}>
        <TouchableOpacity style={styles.listItem} onPress={() => handleNavigate('/my-trips')}>
          <Typography.BodyBase>내 일정</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.stone100 }]}
          onPress={() => handleNavigate('/invite-code')}
        >
          <Typography.BodyBase>초대코드 입력</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        {/* <View style={styles.listItem}>
          <Typography.BodyBase>푸시 알림</Typography.BodyBase>
          <Switch />
        </View> */}
        <TouchableOpacity style={styles.listItem} onPress={() => handleNavigate('/edit-my-info')}>
          <Typography.BodyBase>회원정보 수정</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.stone100 }]}
          onPress={() => setIsContactOpen(true)}
        >
          <Typography.BodyBase>문의 하기</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem} onPress={() => handleNavigate('/terms')}>
          <Typography.BodyBase>서비스 이용약관</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listItem} onPress={() => handleNavigate('/privacy')}>
          <Typography.BodyBase>개인정보처리방침</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: colors.stone100 }]}
          onPress={() => handleNavigate('/licenses')}
        >
          <Typography.BodyBase>오픈소스 라이선스</Typography.BodyBase>
          <Ionicons name="chevron-forward" size={20} color={colors.stone300} />
        </TouchableOpacity>
      </View>
      <ContactInquiryModal
        visible={isContactOpen}
        nickname={user?.nickname}
        email={user?.email}
        onClose={() => setIsContactOpen(false)}
        onSubmitted={() => onNavigate?.()}
      />
      <View style={styles.extraContainer}>
        {accessToken ? (
          <TouchableOpacity onPress={() => mutate()} disabled={isPending}>
            <Typography.BodyMedium>로그아웃</Typography.BodyMedium>
          </TouchableOpacity>
        ) : null}
        <Typography.BodyMedium color={colors.stone500}>v1.0.0 · 최신버전</Typography.BodyMedium>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headingSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 10,
    borderBottomColor: colors.stone100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 4,
    borderBottomWidth: 10,
    borderBottomColor: colors.stone100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.stone50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listContainer: {},
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  extraContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    paddingVertical: 32,
    gap: 32,
  },
});

export default MyPanel;
