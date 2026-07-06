.PHONY: reset unit-test qstash

reset:
	supabase stop --no-backup
	supabase start
	docker run -d --name qstash -p 8080:8080 public.ecr.aws/upstash/qstash:latest qstash dev
	supabase functions serve

unit-test:
	cd supabase/functions/tests && deno test --allow-env --allow-net --allow-read

qstash:
	docker run -p 8080:8080 public.ecr.aws/upstash/qstash:latest qstash dev
