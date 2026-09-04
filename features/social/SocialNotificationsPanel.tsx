import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { SocialNotificationItem } from './api';
import { formatNotificationCount, groupSocialNotifications, type SocialNotificationRow } from './notificationPresentation';
import { isSafeQuestionId } from '@/features/questions/domain';

function relativeTime(value: string, now = Date.now()) {
  const elapsed = Math.max(0, now - Date.parse(value));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Dün' : `${days} gün önce`;
}

function openNotification(item: SocialNotificationRow) {
  if (item.type === 'private_message' && item.conversationId) {
    router.push({ pathname: '/private-chat', params: { conversationId: item.conversationId, ...(item.handle ? { handle: item.handle } : {}) } } as Href);
    return;
  }
  if (item.type === 'soulmate_match') router.push('/soulmate' as Href);
  if (item.type === 'question_answered' && isSafeQuestionId(item.questionId)) router.push(`/questions/${item.questionId}` as Href);
}

export function SocialNotificationsPanel({ notifications }: { notifications: SocialNotificationItem[] }) {
  const rows = groupSocialNotifications(notifications);
  return <View style={styles.section}>
    <Text style={styles.heading}>BİLDİRİMLERİN</Text>
    {!rows.length ? <Text style={styles.empty}>Henüz yeni bildirimin yok.</Text> : <View style={styles.list}>{rows.map((item) => {
      const isMessage = item.type === 'private_message';
      const isQuestion = item.type === 'question_answered';
      const detail = isQuestion ? 'Safir yorumunu tamamladı. Cevabını şimdi görebilirsin.' : isMessage
        ? item.handle ? `@${item.handle} sana mesaj gönderdi.` : 'Yeni bir mesajın var.'
        : item.type === 'soulmate_match' ? item.handle ? `@${item.handle} ile yeni bir astrolojik eşleşmen var.` : 'Yeni bir güçlü astrolojik eşleşmen var.' : 'Yeni bir bildirimin var.';
      const disabled = (isMessage && !item.conversationId) || (isQuestion && !isSafeQuestionId(item.questionId)) || (!isMessage && !isQuestion && item.type !== 'soulmate_match');
      return <Pressable disabled={disabled} key={isMessage && item.conversationId ? `conversation:${item.conversationId}` : item.notificationId} onPress={() => openNotification(item)} style={({ pressed }) => [styles.row, item.unreadCount > 0 && styles.unread, pressed && styles.pressed]}>
        <View style={styles.icon}><Text style={styles.iconText}>{isMessage ? '💬' : '✦'}</Text></View>
        <View style={styles.copy}><View style={styles.titleRow}><Text style={styles.title}>{isQuestion ? 'Sorunun cevabı hazır ✦' : isMessage ? 'Yeni mesaj' : item.type === 'soulmate_match' ? 'Yeni güçlü eşleşme' : 'Bildirim'}</Text>{isMessage && item.unreadCount > 0 ? <View style={styles.countBadge}><Text style={styles.countBadgeText}>{formatNotificationCount(item.unreadCount)}</Text></View> : !item.read ? <View style={styles.dot} /> : null}</View><Text style={styles.detail}>{detail}</Text><Text style={styles.time}>{relativeTime(item.latestCreatedAt)}</Text></View>
      </Pressable>;
    })}</View>}
  </View>;
}

const styles = StyleSheet.create({ section:{gap:10},heading:{color:colors.navy,fontSize:13,fontWeight:'900',letterSpacing:1.1},empty:{color:colors.muted,fontSize:14,lineHeight:20,paddingHorizontal:2},list:{gap:8},row:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.border,borderRadius:16,borderWidth:1,flexDirection:'row',gap:11,minHeight:78,padding:12},unread:{backgroundColor:colors.sapphireSoft},pressed:{opacity:.72},icon:{alignItems:'center',backgroundColor:colors.white,borderRadius:19,height:38,justifyContent:'center',width:38},iconText:{fontSize:18},copy:{flex:1,gap:2,minWidth:0},titleRow:{alignItems:'center',flexDirection:'row',gap:7},title:{color:colors.navy,flexShrink:1,fontSize:15,fontWeight:'900'},dot:{backgroundColor:colors.danger,borderRadius:4,height:8,width:8},countBadge:{alignItems:'center',backgroundColor:colors.danger,borderRadius:10,justifyContent:'center',minHeight:20,minWidth:20,paddingHorizontal:6},countBadgeText:{color:colors.white,fontSize:11,fontWeight:'900'},detail:{color:colors.navy,fontSize:14,lineHeight:20},time:{color:colors.muted,fontSize:11,fontWeight:'700'} });
