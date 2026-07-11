.PHONY: reset unit-test qstash-up qstash-down

reset:
	$(MAKE) qstash-down
	supabase stop --no-backup
	supabase start
	$(MAKE) qstash-up
	supabase functions serve --env-file supabase/.env.local

unit-test:
	cd supabase/functions/tests/unit && deno test --allow-env --allow-net --allow-read

integration-test:
	cd supabase/functions/tests/integration && deno test --allow-env --allow-net --allow-read

qstash-up:
	cd infra/local/ && docker compose up -d && cd ../../

qstash-down:
	cd infra/local/ && docker compose down && cd ../../
