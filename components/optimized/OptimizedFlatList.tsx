import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { useListOptimization } from '@/utils/performanceHelpers';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'data'> {
  data: T[];
  pageSize?: number;
  keyExtractor: (item: T, index: number) => string;
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
}

function OptimizedFlatListComponent<T>({
  data,
  pageSize = 20,
  keyExtractor,
  renderItem,
  ...props
}: OptimizedFlatListProps<T>) {
  const {
    visibleItems,
    loadMore,
    hasMore,
    totalItems,
    loadedItems
  } = useListOptimization(data, pageSize);

  // メモ化されたrenderItem
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem({ item, index }),
    [renderItem]
  );

  // メモ化されたkeyExtractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  // フッターコンポーネントで無限スクロール実装
  const renderFooter = useMemo(() => {
    if (!hasMore) return null;
    
    return () => (
      // 必要に応じてローディングインジケーターを追加
      null
    );
  }, [hasMore]);

  const handleEndReached = useCallback(() => {
    if (hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  return (
    <FlatList
      {...props}
      data={visibleItems}
      keyExtractor={memoizedKeyExtractor}
      renderItem={memoizedRenderItem}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={pageSize}
      updateCellsBatchingPeriod={50}
      getItemLayout={props.getItemLayout}
    />
  );
}

export const OptimizedFlatList = memo(OptimizedFlatListComponent) as <T>(
  props: OptimizedFlatListProps<T>
) => React.ReactElement;