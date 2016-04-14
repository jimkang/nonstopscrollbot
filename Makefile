HOMEDIR = $(shell pwd)
SERVER = sprigot-droplet
SSHCMD = ssh $(SMUSER)@$(SERVER)
APPROOT = /var/www/
PROJECTNAME = nonstopscrollbot
APPDIR = $(APPROOT)$(PROJECTNAME)

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@$(SERVER):$(APPROOT) --exclude node_modules/
	ssh $(SMUSER)@$(SERVER) "cd $(APPDIR) && npm install"

set-permissions:
	$(SSHCMD) "chmod +x $(APPDIR)/post-deal.js"

update-remote: sync set-permissions restart-remote

set-up-directories:
	$(SSHCMD) "mkdir -p $(APPDIR)"

initial-setup: set-up-directories sync set-permissions
