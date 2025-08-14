import { FullUserDto, EditUserDto, ChangePasswordDto, UpdateUserLocationDto } from '@/lib/types/user';
import User, { IUser, IUserLean } from '@/lib/models/User';
import { dbConnect } from '@/lib/db/db';
import bcrypt from 'bcryptjs';
import { deleteFile, uploadBase64Image } from '@/lib/file-utils';

export class UserService {
  async getCurrentUser(userId: string): Promise<FullUserDto> {
    await dbConnect();
    const user = await User.findById(userId).lean<IUserLean>().exec();

    if (!user) {
      throw new Error('User not found');
    }

    return this.mapUserToDto(user);
  }

  async updateUser(userId: string, dto: EditUserDto): Promise<void> {
    await dbConnect();

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    // Update basic fields
    user.name = dto.name;
    user.userName = dto.userName;
    user.email = dto.email;
    user.phone = dto.phone;
    user.address = dto.address;
    user.city = dto.city;
    user.state = dto.state;
    user.country = dto.country;
    user.postalCode = dto.postalCode;
    user.email = dto.email;
    user.updatedAt = new Date();

    // Handle photo update
    if (dto.photoUrl === null) {
      if (user.photoUrl && user.photoUrl !== '/user.png') {
        try {
          await deleteFile(user.photoUrl);
        } catch (error) {
          console.error('Failed to delete photo file:', error);
        }
      }
      user.photoUrl = '/user.png';
    } else if (dto.photoUrl?.startsWith('data:image')) {
      try {
        const photoUrl = await uploadBase64Image(dto.photoUrl, 'users');


        if (user.photoUrl &&
          user.photoUrl !== '/user.png' &&
          user.photoUrl !== photoUrl) {
          try {
            await deleteFile(user.photoUrl);
          } catch (error) {
            console.error('Failed to delete old photo:', error);
          }
        }

        user.photoUrl = photoUrl;
      } catch (error) {
        console.error('Failed to upload new photo:', error);
        throw new Error('Failed to update profile photo');
      }
    } else if (dto.photoUrl !== undefined) {
      user.photoUrl = dto.photoUrl;
    }
    await user.save();
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    await dbConnect();

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    user.updatedAt = new Date();
    await user.save();
  }

  async updateLocation(userId: string, dto: UpdateUserLocationDto): Promise<void> {
    await dbConnect();

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    user.latitude = dto.latitude;
    user.longitude = dto.longitude;
    user.updatedAt = new Date();
    await user.save();
  }

  async getUserById(userId: string): Promise<FullUserDto> {
    await dbConnect();
    const user = await User.findById(userId).lean<IUserLean>().exec();

    if (!user) {
      throw new Error('User not found');
    }

    return this.mapUserToDto(user);
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    await dbConnect();

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
  }

  async restoreUser(userId: string): Promise<void> {
    await dbConnect();

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();
  }


  async updateEmail(userId: string, newEmail: string): Promise<void> {
  await dbConnect();
  const user = await User.findById(userId).exec();
  if (!user) throw new Error('User not found');
  
  user.email = newEmail;
  user.updatedAt = new Date();
  await user.save();
}

  private mapUserToDto(user: IUserLean): FullUserDto {
    return {
      id: user._id.toString(),
      name: user.name,
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      photoUrl: user.photoUrl,
      latitude: user.latitude,
      longitude: user.longitude,
    };
  }
}

export const userService = new UserService();