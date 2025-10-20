import { useParams } from "react-router-dom"

const Profile = () => {
  const params = useParams();

  return (
    <div>Hi {params.username}</div>
  )
}

export default Profile