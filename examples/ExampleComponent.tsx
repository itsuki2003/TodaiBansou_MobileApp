import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export const ExampleComponent = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Supabaseクライアントを使用してデータを取得する例
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('your_table')
          .select('*')
          .limit(1);

        if (error) {
          throw error;
        }

        setData(data);
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <View>
      <Text>データ: {JSON.stringify(data)}</Text>
    </View>
  );
}; 