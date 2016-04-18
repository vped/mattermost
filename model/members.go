// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

package model

import (
	"encoding/json"
)

type Members struct {
	TeamId    string `json:"team_id"`
	Email     string `json:"email"`
	Type      string `json:"type"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
}

type MembersSlice []*Members

func (o MembersSlice) ToJson() string {
	j, err := json.Marshal(o)
	if err != nil {
		return ""
	} else {
		return string(j)
	}
}
