// Legacy v1 commands remain valid; source builds require explicit metadata.
export function validateInstallation(project) {
  const fail = (message) => { throw new Error(`${project.slug || 'unknown'}: ${message}`); };
  const text = (value) => typeof value === 'string' && Boolean(value.trim());
  if (!text(project.command)) fail('command must be non-empty text');
  if (project.installation === undefined) {
    if (!project.command.includes('#v1')) fail('legacy command must include #v1');
    return;
  }
  const install = project.installation;
  if (!install || install.type !== 'rust-source') fail('unsupported installation type');
  if (!['prerequisites', 'platforms'].every((key) => Array.isArray(install[key]) && install[key].length && install[key].every(text))) fail('source installation needs prerequisites and platforms');
  if (!text(install.documentation) || !/^https:\/\/github\.com\//.test(install.documentation)) fail('source installation needs a documentation URL');
  if (!/^[a-f0-9]{40}$/.test(install.ref ?? '')) fail('source installation needs a full commit ref');
  if (!project.command.includes(`git checkout --detach ${install.ref}`) || !project.command.includes('cargo build --release --locked')) fail('source command must checkout its ref and use a locked release build');
  if (!text(project.safety) || !text(project.license) || !text(project.status)) fail('source entry needs safety, license and status');
}
