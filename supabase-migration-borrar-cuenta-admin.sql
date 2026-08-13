-- Borra la cuenta de prueba "Admin" (perfil de Comercio) y todo lo que
-- depende de ella, en orden seguro (hijos antes que el perfil), para que
-- no quede huerfano ni rompa el ranking publico ni ninguna vista.
--
-- Acotado a un unico username exacto a proposito, para no arrastrar
-- ninguna otra cuenta por error. Si el username no existe, el bloque no
-- hace nada (es seguro re-ejecutar).

do $$
declare
  v_profile_id uuid;
begin
  select id into v_profile_id from profiles where username = 'Admin';

  if v_profile_id is null then
    raise notice 'No existe ningun perfil con username = Admin, no se borra nada.';
    return;
  end if;

  -- Mensajes de chat enviados por esta cuenta
  delete from messages where sender_id = v_profile_id;

  -- Notificaciones de esta cuenta
  delete from notifications where user_id = v_profile_id;

  -- Reportes que esta cuenta hizo sobre publicaciones ajenas
  delete from reports where reporter_id = v_profile_id;

  -- Watchlist / favoritos propios
  delete from watchlist where user_id = v_profile_id;
  delete from favorites where user_id = v_profile_id;

  -- Solicitudes de destacado / premium propias
  delete from featured_requests where user_id = v_profile_id;
  delete from premium_requests where user_id = v_profile_id;

  -- Reseñas donde esta cuenta participó (como quien califica o como calificado)
  delete from reviews where reviewer_id = v_profile_id or reviewed_id = v_profile_id;

  -- Transacciones donde participó (como vendedor o comprador) — arrastra
  -- sus mensajes asociados primero, por si alguno quedó del otro lado
  delete from messages where transaction_id in (
    select id from transactions where seller_id = v_profile_id or buyer_id = v_profile_id
  );
  delete from transactions where seller_id = v_profile_id or buyer_id = v_profile_id;

  -- Publicaciones propias: primero lo que otros usuarios generaron sobre
  -- ellas (favoritos, reportes, notificaciones con referencia), para no
  -- chocar con ninguna FK al borrar la publicación en sí
  delete from favorites where listing_id in (select id from listings where user_id = v_profile_id);
  delete from reports where listing_id in (select id from listings where user_id = v_profile_id);
  update notifications set listing_id = null
    where listing_id in (select id from listings where user_id = v_profile_id);
  delete from listings where user_id = v_profile_id;

  -- Por último, el perfil
  delete from profiles where id = v_profile_id;

  raise notice 'Cuenta Admin (id %) borrada junto con todos sus datos asociados.', v_profile_id;
end $$;
