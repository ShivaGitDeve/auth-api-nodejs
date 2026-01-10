import jwt from "jsonwebtoken";

const RefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
};

export default RefreshToken;
