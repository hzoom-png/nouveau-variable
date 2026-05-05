-- SELECT: tout membre authentifié peut lire les projets actifs, ou ses propres projets (même en pause)
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (is_active = true OR auth.uid() = user_id)
  );

-- project_saves : chaque membre gère ses propres sauvegardes
CREATE POLICY "project_saves_select" ON project_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "project_saves_insert" ON project_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_saves_delete" ON project_saves
  FOR DELETE USING (auth.uid() = user_id);

-- project_contacts : le propriétaire du projet lit ses contacts
CREATE POLICY "project_contacts_select_owner" ON project_contacts
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );
