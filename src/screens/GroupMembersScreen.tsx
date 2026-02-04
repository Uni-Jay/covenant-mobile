import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { chatService } from '../services/api';
import { colors } from '../theme/colors';

const primaryColor = colors.primary[800];
const backgroundColor = colors.gray[50];
const textColor = colors.gray[900];
const accentColor = colors.accent;
const dangerColor = colors.error;

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  joined_at: string;
}

type RouteParams = {
  GroupMembers: {
    groupId: number;
    groupName: string;
    userRole?: string;
  };
};

const GroupMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'GroupMembers'>>();
  const { groupId, groupName, userRole = 'member' } = route.params;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isExecutive = userRole === 'admin' || userRole === 'executive';

  useEffect(() => {
    navigation.setOptions({
      title: `${groupName} - Members`,
    } as any);
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await chatService.getGroupMembers(groupId);
      setMembers(data.members);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.removeMember(groupId, memberId);
              Alert.alert('Success', 'Member removed successfully');
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return primaryColor;
      case 'executive':
        return accentColor;
      default:
        return '#999';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'executive':
        return 'Executive';
      default:
        return 'Member';
    }
  };

  const filteredMembers = members.filter((member) =>
    `${member.first_name} ${member.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderMember = ({ item }: { item: Member }) => {
    const memberName = `${item.first_name} ${item.last_name}`;
    const canRemove = isExecutive && item.role !== 'admin';

    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {item.first_name[0]}{item.last_name[0]}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{memberName}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(item.role)}</Text>
          </View>
        </View>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.id, memberName)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.memberCountContainer}>
        <Text style={styles.memberCountText}>
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: backgroundColor,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: textColor,
  },
  memberCountContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  memberCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: textColor,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: dangerColor,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default GroupMembersScreen;
