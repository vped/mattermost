// Copyright (c) 2015 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

package api

import (
	l4g "github.com/alecthomas/log4go"
	"github.com/gorilla/mux"
	"github.com/mattermost/platform/model"
	"github.com/mattermost/platform/utils"
	"net/http"
)

func InitMembers(r *mux.Router) {
	l4g.Debug(utils.T("api.members.init.debug"))

	sr := r.PathPrefix("/members").Subrouter()
	sr.Handle("/list", ApiAppHandler(listMembers)).Methods("GET")
	sr.Handle("/invite", ApiAppHandler(inviteMember)).Methods("POST")
}

func listMembers(c *Context, w http.ResponseWriter, r *http.Request) {
	if result := <-Srv.Store.Members().List(c.Session.TeamId); result.Err != nil {
		c.Err = result.Err
		return
	} else {
		members := result.Data.(model.MembersSlice)

		w.Write([]byte(members.ToJson()))
	}
}

func inviteMember(c *Context, w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	email := params["email"]
	if email == "" {
		c.SetInvalidParam("inviteMember", "email")
		return
	}
	if result := <-Srv.Store.Members().Invite(c.Session.TeamId, email); result.Err != nil {
		c.Err = result.Err
		return
	} else {
		w.Write([]byte(`{"SUCCESS": "true"}`))
	}
}
