import {UserAccountPage} from '../../components/UserAccountPage'

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  console.log(username);
  return <UserAccountPage usernameParam={username}/>;
}
