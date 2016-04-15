// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

package store

import (
	"github.com/mattermost/platform/model"
)

type SqlMembersStore struct {
	*SqlStore
}

func NewSqlMembersStore(sqlStore *SqlStore) MembersStore {
	st := &SqlMembersStore{sqlStore}

	for _, db := range sqlStore.GetAllConns() {
		table := db.AddTableWithName(model.Members{}, "Members")
		table.ColMap("TeamId").SetMaxSize(26)
		table.ColMap("Email").SetMaxSize(128)
		table.ColMap("Type").SetMaxSize(10)
		table.SetUniqueTogether("TeamId", "Email")
	}

	return st
}

func (st SqlMembersStore) UpgradeSchemaIfNeeded() {
}

func (st SqlMembersStore) CreateIndexesIfNotExists() {
}

func (st SqlMembersStore) List(teamId string) StoreChannel {

	storeChannel := make(StoreChannel)

	go func() {
		result := StoreResult{}

		var members model.MembersSlice

		if _, err := st.GetReplica().Select(&members, "SELECT * FROM Members WHERE TeamId = :TeamId", map[string]interface{}{"TeamId": teamId}); err != nil {
			result.Err = model.NewLocAppError("SqlMembersStore.List", "store.sql_members.list.app_error", nil, err.Error())
		} else {
			result.Data = members
		}

		storeChannel <- result
		close(storeChannel)
	}()

	return storeChannel
}

func (st SqlMembersStore) Invite(teamId, email string) StoreChannel {
	storeChannel := make(StoreChannel)
	go func() {
		result := StoreResult{}
		members := &model.MembersSlice{}

		if _, err := st.GetReplica().Select(members, "SELECT * FROM Members WHERE TeamId = :TeamId AND Email = :Email", map[string]interface{}{"TeamId": teamId, "Email": email}); err != nil {
			result.Err = model.NewLocAppError("SqlMembersStore.Invite", "store.sql_post.invite.app_error", nil, "TeamId="+teamId+", Email="+email+", err="+err.Error())
		} else {
			_, err := st.GetMaster().Exec("INSERT INTO Members VALUES (:TeamId, :Email, 'invited')", map[string]interface{}{"TeamId": teamId, "Email": email})
			if err != nil {
				result.Err = model.NewLocAppError("SqlMembersStore.Invite", "store.sql_post.invite.app_error", nil, "TeamId="+teamId+", Email="+email+", err="+err.Error())
			}
		}

		storeChannel <- result
		close(storeChannel)
	}()
	return storeChannel
}
