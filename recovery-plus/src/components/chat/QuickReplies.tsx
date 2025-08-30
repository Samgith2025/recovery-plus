import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';

interface QuickRepliesProps {
  replies: string[];
  onReplyPress: (reply: string) => void;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  replies,
  onReplyPress,
}) => {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        marginVertical: theme.spacing[2],
        marginHorizontal: theme.spacing[1],
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing[2],
        }}
      >
        {replies.map((reply, index) => (
          <Pressable
            key={index}
            onPress={() => onReplyPress(reply)}
            style={{
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.primary[300],
              borderRadius: theme.borderRadius.xl,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              marginHorizontal: theme.spacing[1],
              elevation: 1,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.primary[700],
              }}
            >
              {reply}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
