import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../styles/theme';
import { Exercise } from '../types';
import { useExerciseStore } from '../store/exercise';
import { getSafeAreaInsets, getDeviceType } from '../utils/device';
import { exerciseLogger } from '../services/logger';
import { youtubeService, YouTubeVideo } from '../services/youtubeService';
import { VideoQualitySelector } from '../components/ui/VideoQualitySelector';
import { OfflineVideoFallback } from '../components/ui/OfflineVideoFallback';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { PremiumFeatureGate } from '../components/subscription/PremiumFeatureGate';
import { useSubscription } from '../hooks/useSubscription';

interface ExerciseDetailScreenProps {
  exercise: Exercise;
  onBackPress: () => void;
  onStartWorkout?: (exercise: Exercise) => void;
}

export const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({
  exercise,
  onBackPress,
  onStartWorkout,
}) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [searchedVideos, setSearchedVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [videoQuality, setVideoQuality] = useState('hd720');
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  const networkStatus = useNetworkStatus();
  const { trackExerciseUsage, requestFeatureAccess, isPremiumUser } =
    useSubscription();

  const safeArea = getSafeAreaInsets();
  const deviceType = getDeviceType();
  const screenWidth = Dimensions.get('window').width;
  const videoHeight = (screenWidth - theme.spacing[8]) * (9 / 16); // 16:9 aspect ratio

  const { startSession, currentSession } = useExerciseStore();

  useEffect(() => {
    exerciseLogger.info('Exercise detail viewed', {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    });
  }, [exercise]);

  // Search for exercise videos when component loads
  useEffect(() => {
    const searchForVideos = async () => {
      if (
        !exercise.videoUrl &&
        (!exercise.videoUrls || exercise.videoUrls.length === 0) &&
        networkStatus.isOnline
      ) {
        setIsSearchingVideos(true);
        setShowOfflineFallback(false);
        try {
          const videos = await youtubeService.searchVideos({
            query: exercise.name,
            exerciseName: exercise.name,
            targetMuscles: exercise.targetMuscles,
            level: exercise.level,
            maxResults: 3,
          });
          setSearchedVideos(videos);
          exerciseLogger.info('Exercise videos found', {
            exerciseId: exercise.id,
            videosCount: videos.length,
          });
        } catch (error) {
          exerciseLogger.error('Failed to search exercise videos', {
            exerciseId: exercise.id,
            error,
          });
          if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => searchForVideos(), 2000);
          } else {
            setShowOfflineFallback(true);
          }
        } finally {
          setIsSearchingVideos(false);
        }
      } else if (!networkStatus.isOnline) {
        setShowOfflineFallback(true);
      }
    };

    searchForVideos();
  }, [
    exercise.id,
    exercise.name,
    exercise.targetMuscles,
    exercise.level,
    exercise.videoUrl,
    networkStatus.isOnline,
    retryCount,
  ]);

  // Auto-adjust video quality based on connection
  useEffect(() => {
    if (networkStatus.isOnline && networkStatus.canStreamVideo) {
      const recommendedQuality = networkStatus.getRecommendedVideoQuality();
      if (videoQuality === 'auto' || !videoQuality) {
        setVideoQuality(recommendedQuality);
      }
    }
  }, [networkStatus.isOnline, networkStatus.canStreamVideo]);

  const getLevelColor = () => {
    switch (exercise.level) {
      case 'BEGINNER':
        return theme.colors.success[500];
      case 'INTERMEDIATE':
        return theme.colors.warning[500];
      case 'ADVANCED':
        return theme.colors.error[500];
      default:
        return theme.colors.gray[500];
    }
  };

  const getLevelBackgroundColor = () => {
    switch (exercise.level) {
      case 'BEGINNER':
        return theme.colors.success[50];
      case 'INTERMEDIATE':
        return theme.colors.warning[50];
      case 'ADVANCED':
        return theme.colors.error[50];
      default:
        return theme.colors.gray[50];
    }
  };

  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;

    const videoId = youtubeService.extractVideoId(url);
    if (!videoId) return null;

    return youtubeService.getEmbedUrl(videoId, videoQuality);
  };

  const getCurrentVideoUrl = (): string | null => {
    // Use provided URL if available
    if (exercise.videoUrl) {
      return getYouTubeEmbedUrl(exercise.videoUrl);
    }

    // Check videoUrls array if no single videoUrl
    if (exercise.videoUrls && exercise.videoUrls.length > 0) {
      return getYouTubeEmbedUrl(exercise.videoUrls[0]);
    }

    // Otherwise use searched videos
    if (
      searchedVideos.length > 0 &&
      selectedVideoIndex < searchedVideos.length
    ) {
      return searchedVideos[selectedVideoIndex].embedUrl;
    }

    return null;
  };

  const handleVideoSelection = (index: number) => {
    setSelectedVideoIndex(index);
    setVideoError(false);
    setIsVideoLoaded(false);

    exerciseLogger.info('Video selection changed', {
      exerciseId: exercise.id,
      videoIndex: index,
      videoTitle: searchedVideos[index]?.title,
    });
  };

  const handleVideoError = () => {
    setVideoError(true);
    exerciseLogger.warn('Video failed to load', {
      exerciseId: exercise.id,
      videoUrl: getCurrentVideoUrl(),
      searchedVideosCount: searchedVideos.length,
      selectedIndex: selectedVideoIndex,
      networkStatus: {
        isOnline: networkStatus.isOnline,
        connectionQuality: networkStatus.connectionQuality,
      },
    });

    // Try next video if available
    if (
      searchedVideos.length > 1 &&
      selectedVideoIndex < searchedVideos.length - 1
    ) {
      setTimeout(() => {
        handleVideoSelection(selectedVideoIndex + 1);
      }, 1000);
    } else if (!networkStatus.canStreamVideo) {
      // Show offline fallback if network is poor
      setShowOfflineFallback(true);
    }
  };

  const handleRetryVideo = () => {
    setRetryCount(0);
    setShowOfflineFallback(false);
    setVideoError(false);
    setIsVideoLoaded(false);

    exerciseLogger.info('Video retry initiated', {
      exerciseId: exercise.id,
      networkStatus: {
        isOnline: networkStatus.isOnline,
        connectionQuality: networkStatus.connectionQuality,
      },
    });
  };

  const shouldShowVideo = () => {
    return (embedUrl || isSearchingVideos) && !showOfflineFallback;
  };

  const handleStartWorkout = async () => {
    if (currentSession && currentSession.isActive) {
      Alert.alert(
        'Workout in Progress',
        'You already have an active workout. Would you like to end it and start a new one?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End & Start New',
            onPress: () => startNewWorkout(),
          },
        ]
      );
      return;
    }

    startNewWorkout();
  };

  const startNewWorkout = () => {
    // Check if user can start another exercise
    if (!trackExerciseUsage()) {
      // trackExerciseUsage will show paywall if needed
      return;
    }

    setIsStarting(true);

    try {
      const session = startSession(exercise);

      exerciseLogger.info('Workout session started', {
        sessionId: session.id,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        isPremiumUser,
      });

      if (onStartWorkout) {
        onStartWorkout(exercise);
      } else {
        // For demo purposes - in a real app this would navigate to ExerciseSessionScreen
        Alert.alert(
          'Workout Started!',
          `Started ${exercise.name} workout with ${session.sets.length} sets. The exercise session screen would open here with timer functionality.`,
          [
            {
              text: 'Continue to Session',
              onPress: () => {
                // TODO: Navigate to ExerciseSessionScreen
                console.log('Would navigate to ExerciseSessionScreen with:', {
                  exercise,
                  session,
                });
              },
            },
            {
              text: 'Demo Feedback',
              onPress: () => handleWorkoutComplete(session),
            },
          ]
        );
      }
    } catch (error) {
      exerciseLogger.error('Failed to start workout session', { error });
      Alert.alert(
        'Error',
        'Failed to start workout session. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleWorkoutComplete = (session: any) => {
    // This would typically navigate to the feedback form
    // For demo purposes, we'll show an alert
    Alert.alert(
      'Workout Complete!',
      'Great job! Your feedback will help us improve your next workout.',
      [
        { text: 'Skip Feedback', style: 'cancel' },
        { text: 'Provide Feedback', onPress: () => showFeedbackDemo() },
      ]
    );
  };

  const showFeedbackDemo = () => {
    Alert.alert(
      'Feedback System',
      'The feedback form would appear here, asking about:\n\n• Pain level (1-10)\n• Exercise difficulty (1-10)\n• Energy level\n• How much you enjoyed it\n• Any modifications needed',
      [{ text: 'Got it!' }]
    );
  };

  const DetailCard = ({
    title,
    value,
    backgroundColor,
  }: {
    title: string;
    value: string;
    backgroundColor?: string;
  }) => (
    <View
      style={{
        backgroundColor: backgroundColor || theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        alignItems: 'center',
        flex: 1,
        marginHorizontal: theme.spacing[1],
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[1],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </View>
  );

  const embedUrl = getCurrentVideoUrl();
  const currentVideo = searchedVideos[selectedVideoIndex];
  const hasMultipleVideos = searchedVideos.length > 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: getLevelBackgroundColor(),
            paddingTop: safeArea.top + theme.spacing[2],
            paddingHorizontal: theme.spacing[4],
            paddingBottom: theme.spacing[4],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            <Pressable
              onPress={onBackPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: theme.spacing[3],
                elevation: 2,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center' }}>
            {/* Exercise icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: theme.spacing[3],
                elevation: 4,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>{exercise.icon || '💪'}</Text>
            </View>

            {/* Exercise name */}
            <Text
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                textAlign: 'center',
                marginBottom: theme.spacing[2],
              }}
            >
              {exercise.name}
            </Text>

            {/* Target muscles */}
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {exercise.targetMuscles.join(', ')}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View
          style={{
            paddingHorizontal: theme.spacing[4],
            marginTop: theme.spacing[4],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            Details
          </Text>

          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: -theme.spacing[1],
              marginBottom: theme.spacing[6],
            }}
          >
            <DetailCard
              title="Level"
              value={exercise.level}
              backgroundColor={getLevelBackgroundColor()}
            />
            <DetailCard title="Duration" value={exercise.duration} />
          </View>
        </View>

        {/* Video Section - Premium Feature Gate */}
        <PremiumFeatureGate
          feature="premiumContent"
          bypassCheck={__DEV__} // Allow videos in development mode
          customMessage="High-quality exercise videos are available with Premium subscription."
          fallback={
            <View
              style={{
                backgroundColor: theme.colors.gray[50],
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing[4],
                marginHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[6],
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: theme.spacing[2] }}>
                📋
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                Video demonstrations available with Premium
              </Text>
            </View>
          }
        >
          {(shouldShowVideo() || showOfflineFallback) && (
            <View
              style={{
                paddingHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[6],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing[4],
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                  }}
                >
                  How to perform
                </Text>

                {hasMultipleVideos && (
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {selectedVideoIndex + 1} of {searchedVideos.length}
                  </Text>
                )}
              </View>

              {/* Video selection buttons */}
              {hasMultipleVideos && (
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: theme.spacing[3],
                    gap: theme.spacing[2],
                  }}
                >
                  {searchedVideos.slice(0, 3).map((video, index) => (
                    <Pressable
                      key={video.id}
                      onPress={() => handleVideoSelection(index)}
                      style={{
                        flex: 1,
                        backgroundColor:
                          index === selectedVideoIndex
                            ? theme.colors.primary[100]
                            : theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                        padding: theme.spacing[2],
                        borderWidth: 1,
                        borderColor:
                          index === selectedVideoIndex
                            ? theme.colors.primary[500]
                            : theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color:
                            index === selectedVideoIndex
                              ? theme.colors.primary[700]
                              : theme.colors.text.secondary,
                          textAlign: 'center',
                          numberOfLines: 2,
                        }}
                      >
                        Video {index + 1}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Current video info */}
              {currentVideo && (
                <View
                  style={{
                    backgroundColor: theme.colors.gray[50],
                    padding: theme.spacing[3],
                    borderRadius: theme.borderRadius.md,
                    marginBottom: theme.spacing[3],
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    {currentVideo.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {currentVideo.channelTitle} • {currentVideo.duration}
                  </Text>
                </View>
              )}

              {/* Video controls */}
              {embedUrl && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginBottom: theme.spacing[3],
                    gap: theme.spacing[2],
                  }}
                >
                  <Pressable
                    onPress={() => setShowQualitySelector(true)}
                    style={{
                      backgroundColor: theme.colors.gray[100],
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      borderRadius: theme.borderRadius.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[1],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Quality
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.tertiary,
                      }}
                    >
                      ⚙︎
                    </Text>
                  </Pressable>

                  {currentVideo?.fallbackUrl && (
                    <Pressable
                      onPress={() => {
                        // In a real app, you would open this URL externally
                        exerciseLogger.info('External video link pressed', {
                          exerciseId: exercise.id,
                          videoUrl: currentVideo.fallbackUrl,
                        });
                      }}
                      style={{
                        backgroundColor: theme.colors.primary[100],
                        paddingHorizontal: theme.spacing[3],
                        paddingVertical: theme.spacing[2],
                        borderRadius: theme.borderRadius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing[1],
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.primary[700],
                        }}
                      >
                        Open in YouTube
                      </Text>
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.primary[600],
                        }}
                      >
                        ↗︎
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View
                style={{
                  height: videoHeight,
                  borderRadius: theme.borderRadius.lg,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.gray[900],
                  elevation: 4,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                }}
              >
                {isSearchingVideos ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: theme.colors.gray[100],
                    }}
                  >
                    <Text
                      style={{ fontSize: 32, marginBottom: theme.spacing[2] }}
                    >
                      🔍
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        color: theme.colors.text.secondary,
                        textAlign: 'center',
                      }}
                    >
                      Finding exercise videos...
                    </Text>
                  </View>
                ) : embedUrl && !videoError ? (
                  <WebView
                    key={`${selectedVideoIndex}-${videoQuality}`}
                    source={{ uri: embedUrl }}
                    style={{ flex: 1 }}
                    allowsFullscreenVideo={false}
                    mediaPlaybackRequiresUserGesture={false}
                    onLoadStart={() => setIsVideoLoaded(false)}
                    onLoadEnd={() => setIsVideoLoaded(true)}
                    onError={handleVideoError}
                    startInLoadingState
                    scrollEnabled={false}
                    bounces={false}
                    scalesPageToFit={false}
                    allowsInlineMediaPlayback={true}
                    allowsBackForwardNavigationGestures={false}
                    onNavigationStateChange={navState => {
                      // Prevent navigation away from the embed
                      if (navState.url !== embedUrl && !navState.loading) {
                        return false;
                      }
                    }}
                  />
                ) : showOfflineFallback ? (
                  <OfflineVideoFallback
                    exercise={exercise}
                    onRetry={
                      networkStatus.isOnline ? handleRetryVideo : undefined
                    }
                    isRetrying={isSearchingVideos}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: theme.colors.gray[100],
                    }}
                  >
                    <Text
                      style={{ fontSize: 32, marginBottom: theme.spacing[2] }}
                    >
                      {!networkStatus.isOnline ? '📋' : '📹'}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.base,
                        color: theme.colors.text.secondary,
                        textAlign: 'center',
                      }}
                    >
                      {!networkStatus.isOnline
                        ? 'No internet connection'
                        : videoError
                          ? 'Video unavailable'
                          : 'No video found'}
                    </Text>
                    {hasMultipleVideos && videoError && (
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.tertiary,
                          textAlign: 'center',
                          marginTop: theme.spacing[1],
                        }}
                      >
                        Trying alternative videos...
                      </Text>
                    )}

                    {!networkStatus.isOnline && (
                      <Pressable
                        onPress={() => setShowOfflineFallback(true)}
                        style={{
                          backgroundColor: theme.colors.primary[500],
                          paddingHorizontal: theme.spacing[4],
                          paddingVertical: theme.spacing[2],
                          borderRadius: theme.borderRadius.md,
                          marginTop: theme.spacing[3],
                        }}
                      >
                        <Text
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.surface,
                          }}
                        >
                          View Instructions
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {!isVideoLoaded &&
                  !videoError &&
                  !isSearchingVideos &&
                  embedUrl && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.surface,
                        }}
                      >
                        Loading video...
                      </Text>
                    </View>
                  )}
              </View>
            </View>
          )}
        </PremiumFeatureGate>

        {/* Description */}
        <View
          style={{
            paddingHorizontal: theme.spacing[4],
            marginBottom: theme.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            Description
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              lineHeight: theme.typography.lineHeight.relaxed,
              marginBottom: theme.spacing[4],
            }}
          >
            {exercise.description ||
              `${exercise.name} is an excellent exercise for targeting your ${exercise.targetMuscles.join(', ')}. Perfect for ${exercise.level.toLowerCase()} level fitness enthusiasts.`}
          </Text>
        </View>

        {/* Equipment needed */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <View
            style={{
              paddingHorizontal: theme.spacing[4],
              marginBottom: theme.spacing[6],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              Equipment needed
            </Text>

            {exercise.equipment.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.colors.success[500],
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: theme.spacing[3],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.surface,
                    }}
                  >
                    ✓
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text.primary,
                  }}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Start workout button */}
        <View
          style={{
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[4],
          }}
        >
          <View style={{ gap: theme.spacing[3] }}>
            <Pressable
              onPress={handleStartWorkout}
              disabled={isStarting}
              style={{
                backgroundColor: isStarting
                  ? theme.colors.gray[400]
                  : theme.colors.primary[500],
                paddingVertical: theme.spacing[4],
                borderRadius: theme.borderRadius.lg,
                alignItems: 'center',
                elevation: 4,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.surface,
                }}
              >
                {isStarting ? 'Starting...' : 'Start Workout'}
              </Text>
            </Pressable>

            {/* Demo Feedback Button */}
            <Pressable
              onPress={showFeedbackDemo}
              style={{
                backgroundColor: theme.colors.gray[100],
                paddingVertical: theme.spacing[3],
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                }}
              >
                Preview Feedback System
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Video Quality Selector Modal */}
      <VideoQualitySelector
        visible={showQualitySelector}
        currentQuality={videoQuality}
        onQualityChange={quality => {
          setVideoQuality(quality);
          setVideoError(false);
          setIsVideoLoaded(false);
          exerciseLogger.info('Video quality changed', {
            exerciseId: exercise.id,
            newQuality: quality,
          });
        }}
        onClose={() => setShowQualitySelector(false)}
      />
    </SafeAreaView>
  );
};
