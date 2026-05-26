insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'Knowy Demo', 'knowy-demo')
on conflict (id) do nothing;

