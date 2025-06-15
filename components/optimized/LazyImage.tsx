import React, { useState, memo, useCallback } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useOptimizedImageLoader } from '@/utils/performanceHelpers';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  fadeDuration?: number;
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  source,
  placeholder,
  errorComponent,
  loadingComponent,
  fadeDuration = 300,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadImage = useOptimizedImageLoader();

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  // URLがある場合は事前ロード
  React.useEffect(() => {
    if (typeof source === 'object' && source.uri) {
      loadImage(source.uri).catch(() => {
        setError(true);
        setLoading(false);
      });
    }
  }, [source, loadImage]);

  if (error && errorComponent) {
    return <View style={style}>{errorComponent}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (loadingComponent || (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ))}
      
      {placeholder && loading && (
        <View style={StyleSheet.absoluteFill}>
          {placeholder}
        </View>
      )}
      
      <Image
        {...props}
        source={source}
        style={[
          StyleSheet.absoluteFill,
          { opacity: loading ? 0 : 1 }
        ]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        fadeDuration={fadeDuration}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;