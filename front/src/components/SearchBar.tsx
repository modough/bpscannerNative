import { View, TextInput, Text, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function SearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
}: SearchBarProps) {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 48,
          marginBottom: 12,
        }}
      >
        <Ionicons name="search" size={20} color="#fff" />

        <TextInput
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 16,
            color: "#fff",
          }}
          placeholder="Search boarding passes..."
          value={value}
          onChangeText={onChange}
          testID="search-input"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {value.length > 0 && (
          <Pressable onPress={() => onChange("")} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {value.length > 0 && (
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          Showing {resultCount} of {totalCount} boarding passes
        </Text>
      )}
    </View>
  );
}